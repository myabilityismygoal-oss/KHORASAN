import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, storage } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowRight, User as UserIcon, Loader2, MessageSquare, Search, ChevronLeft, Image as ImageIcon, Video, Plus, X, Smartphone } from 'lucide-react';
import { Message, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { sendNotification } from '../services/notificationService';

interface Props {
  user: User;
}

interface Conversation {
  otherUser: UserProfile;
  lastMessage: Message;
}

const Messaging: React.FC<Props> = ({ user }) => {
  const { receiverId } = useParams<{ receiverId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiver, setReceiver] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [convLoading, setConvLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string, type: 'image' | 'video', file: File } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations list
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      const convMap = new Map<string, Message>();
      allMsgs.forEach(msg => {
        const otherId = msg.participants.find(p => p !== user.uid);
        if (otherId && !convMap.has(otherId)) {
          convMap.set(otherId, msg);
        }
      });

      const fetchProfiles = Array.from(convMap.entries()).map(async ([otherId, lastMsg]) => {
        const userRef = doc(db, 'users', otherId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return {
            otherUser: userSnap.data() as UserProfile,
            lastMessage: lastMsg
          };
        }
        return null;
      });

      const results = await Promise.all(fetchProfiles);
      setConversations(results.filter((c): c is Conversation => c !== null));
      setConvLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Fetch specific chat
  useEffect(() => {
    if (!receiverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchReceiver = async () => {
      const docRef = doc(db, 'users', receiverId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setReceiver(docSnap.data() as UserProfile);
      }
      setLoading(false);
    };
    fetchReceiver();

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      const filtered = allMessages.filter(m => 
        (m.senderId === user.uid && m.receiverId === receiverId) ||
        (m.senderId === receiverId && m.receiverId === user.uid)
      );
      setMessages(filtered);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [receiverId, user.uid]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith('image/') ? 'image' : 'video';
    const url = URL.createObjectURL(file);
    setPreview({ url, type, file });
  };

  const handleSendSMS = () => {
    if (!receiver?.whatsapp) return;
    const confirmed = window.confirm("آیا می‌خواهید برنامه پیامک گوشی شما باز شود؟");
    if (confirmed) {
      window.location.href = `sms:${receiver.whatsapp}`;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !preview) || !receiverId) return;

    setUploading(true);
    let mediaUrl = '';
    let mediaType: 'image' | 'video' | undefined = undefined;

    if (preview) {
      const storageRef = ref(storage, `messages/${user.uid}/${Date.now()}_${preview.file.name}`);
      await uploadBytes(storageRef, preview.file);
      mediaUrl = await getDownloadURL(storageRef);
      mediaType = preview.type;
    }

    const messageData = {
      senderId: user.uid,
      receiverId: receiverId,
      participants: [user.uid, receiverId],
      text: newMessage,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      timestamp: serverTimestamp(),
      read: false
    };

    setNewMessage('');
    setPreview(null);
    try {
      await addDoc(collection(db, 'messages'), messageData);

      if (receiver?.preferences?.notifyMessages !== false) {
        await sendNotification(
          receiverId,
          'پیام جدید',
          `شما یک پیام جدید از ${user.displayName || user.email} دارید.`,
          'info',
          'message',
          `/messages/${user.uid}`
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading && receiverId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Conversation List View
  if (!receiverId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
            >
              <ArrowRight size={24} />
            </button>
            <h1 className="text-2xl font-black text-gray-900">پیام‌ها</h1>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquare size={24} />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="جستجو در گفتگوها..."
            className="w-full pr-12 pl-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {convLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">هنوز گفتگویی ندارید.</p>
            <p className="text-xs text-gray-400 mt-1">با مراجعه به پروفایل کسب‌وکارها می‌توانید به آن‌ها پیام دهید.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <motion.div
                key={conv.otherUser.uid}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/messages/${conv.otherUser.uid}`)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-50">
                    {conv.otherUser.photoURL || conv.otherUser.businessProfile?.logo ? (
                      <img 
                        src={conv.otherUser.photoURL || conv.otherUser.businessProfile?.logo} 
                        alt="" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon size={24} className="text-gray-400" />
                    )}
                  </div>
                  {conv.otherUser.businessProfile?.isOnline && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 truncate">
                      {conv.otherUser.businessProfile?.name || conv.otherUser.displayName || 'کاربر'}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {conv.lastMessage.timestamp?.toDate ? conv.lastMessage.timestamp.toDate().toLocaleDateString('fa-IR') : '...'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage.senderId === user.uid ? 'شما: ' : ''}
                    {conv.lastMessage.mediaUrl ? (conv.lastMessage.mediaType === 'image' ? '📷 تصویر' : '🎥 ویدیو') : conv.lastMessage.text}
                  </p>
                </div>
                <ChevronLeft size={20} className="text-gray-300" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chat Window View
  return (
    <div className="max-w-2xl mx-auto h-[80vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
      {/* Chat Header */}
      <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/messages')} 
            className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-gray-900"
          >
            <ArrowRight size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden">
              {receiver?.photoURL || receiver?.businessProfile?.logo ? (
                <img 
                  src={receiver?.photoURL || receiver?.businessProfile?.logo} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon size={24} />
              )}
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-black text-gray-900">
                  {receiver?.businessProfile?.name || receiver?.displayName || 'کاربر'}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-green-600 font-bold">آنلاین</p>
                </div>
              </div>
              {receiver?.whatsapp && (
                <button 
                  onClick={handleSendSMS}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                  title="ارسال پیامک"
                >
                  <Smartphone size={18} />
                  <span className="text-[10px] font-black hidden sm:inline">SMS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col max-w-[80%]",
              m.senderId === user.uid ? "mr-auto items-end" : "ml-auto items-start"
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "rounded-2xl text-sm shadow-sm leading-relaxed overflow-hidden",
                m.senderId === user.uid 
                  ? "bg-blue-600 text-white rounded-tr-none shadow-blue-100" 
                  : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
              )}
            >
              {m.mediaUrl && (
                <div className="mb-2">
                  {m.mediaType === 'image' ? (
                    <img src={m.mediaUrl} alt="" className="max-w-full h-auto rounded-lg" referrerPolicy="no-referrer" />
                  ) : (
                    <video src={m.mediaUrl} controls className="max-w-full h-auto rounded-lg" />
                  )}
                </div>
              )}
              {m.text && <div className="px-4 py-3">{m.text}</div>}
            </motion.div>
            <span className="text-[9px] text-gray-400 mt-1.5 px-2 font-medium">
              {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '...'}
            </span>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-50">
        <AnimatePresence>
          {preview && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 relative inline-block"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-500 bg-gray-100">
                {preview.type === 'image' ? (
                  <img src={preview.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={preview.url} className="w-full h-full object-cover" />
                )}
              </div>
              <button 
                onClick={() => setPreview(null)}
                className="absolute -top-2 -left-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-blue-600 transition-all"
          >
            <Plus size={24} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 bg-transparent border-none px-4 py-2 outline-none text-sm placeholder:text-gray-400"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={(!newMessage.trim() && !preview) || uploading}
            className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Messaging;
