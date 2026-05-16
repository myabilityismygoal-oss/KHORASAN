import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, MessageCircle, CheckCircle2, Plus, Send, User, Clock, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Riddle {
  id: string;
  authorId: string;
  question: string;
  answer?: string;
  isAnswered: boolean;
  comments: Comment[];
  createdAt: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

const Riddles: React.FC = () => {
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'riddles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Riddle));
      setRiddles(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddRiddle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newQuestion.trim()) return;

    try {
      await addDoc(collection(db, 'riddles'), {
        authorId: auth.currentUser.uid,
        question: newQuestion,
        isAnswered: false,
        comments: [],
        createdAt: new Date().toISOString(),
      });
      setNewQuestion('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding riddle:", error);
    }
  };

  const handleAddComment = async (riddleId: string, content: string) => {
    if (!auth.currentUser || !content.trim()) return;

    const riddleRef = doc(db, 'riddles', riddleId);
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'کاربر ناشناس',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateDoc(riddleRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const filteredRiddles = riddles.filter(riddle => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unanswered' && !riddle.isAnswered) || 
                      (activeTab === 'answered' && riddle.isAnswered);
    const matchesSearch = riddle.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Back Button */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold text-sm group"
        >
          <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
            <Search size={18} className="rotate-180" />
          </div>
          بازگشت
        </button>
        <div className="text-xs font-bold text-gray-400">معما و چیستان</div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">معما و چیستان</h1>
          <p className="text-gray-500 text-sm">سوالات بی‌پاسخ را حل کنید و نظر بدهید</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Search and Tabs */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md py-4 space-y-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="جستجو در معماها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'unanswered', 'answered'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-gray-900 text-white shadow-lg" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab === 'all' ? 'همه' : tab === 'unanswered' ? 'بی‌پاسخ' : 'حل شده'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredRiddles.map((riddle) => (
              <motion.div
                key={riddle.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-relaxed">
                        {riddle.question}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                        <Clock size={12} />
                        {new Date(riddle.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                  {riddle.isAnswered && (
                    <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                      <CheckCircle2 size={14} />
                      حل شده
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <MessageCircle size={18} />
                    نظرات و پاسخ‌ها ({riddle.comments?.length || 0})
                  </div>
                  
                  <div className="space-y-3">
                    {riddle.comments?.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-2xl p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900">{comment.authorName}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.createdAt).toLocaleTimeString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.target as any).elements.comment;
                      handleAddComment(riddle.id, input.value);
                      input.value = '';
                    }}
                    className="flex gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100"
                  >
                    <input
                      name="comment"
                      type="text"
                      placeholder="پاسخ یا نظر خود را بنویسید..."
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400"
                    />
                    <motion.button 
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <Send size={20} />
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Riddle Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                  <HelpCircle size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">طرح معمای جدید</h2>
                <p className="text-gray-500 text-sm">معمای خود را با دیگران به اشتراک بگذارید</p>
              </div>

              <form onSubmit={handleAddRiddle} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-2">متن معما</label>
                  <textarea
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="مثلاً: آن چیست که پر دارد اما پرواز نمی‌کند؟"
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 min-h-[150px] focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    انتشار معما
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Riddles;
