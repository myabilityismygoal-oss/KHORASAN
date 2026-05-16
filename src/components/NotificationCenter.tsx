import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { Notification, UserProfile } from '../types';
import { subscribeToNotifications, markAsRead, deleteNotification, sendNotification } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  user: User | null;
  profile: UserProfile | null;
}

const NotificationCenter: React.FC<Props> = ({ user, profile }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminType, setAdminType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'error': return <XCircle className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const handleSendToAll = async () => {
    if (!adminTitle || !adminMessage || isSending) return;
    
    setIsSending(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const sendPromises = usersSnapshot.docs.map(doc => 
        sendNotification(doc.id, adminTitle, adminMessage, adminType, 'system')
      );
      await Promise.all(sendPromises);
      setAdminTitle('');
      setAdminMessage('');
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setShowAdminPanel(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending to all:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
        title="اعلان‌ها"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-sm">اعلان‌ها</h3>
                <div className="flex items-center gap-2">
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      className="text-[10px] text-blue-600 font-medium hover:underline"
                    >
                      پنل مدیریت
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {showAdminPanel ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h4 className="text-sm font-black text-gray-800">ارسال اعلان همگانی</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-tight">پنل مدیریت</span>
                    </div>
                    
                    {sendSuccess ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-10 text-center bg-green-50 rounded-2xl border border-green-100"
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-200">
                          <CheckCircle className="text-green-500" size={32} />
                        </div>
                        <h5 className="text-sm font-black text-green-900 mb-1">ارسال موفقیت‌آمیز</h5>
                        <p className="text-xs text-green-600 font-bold max-w-[200px] mx-auto leading-relaxed">اعلان با موفقیت برای تمامی کاربران ارسال گردید.</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">عنوان اعلان</label>
                          <input
                            type="text"
                            placeholder="مثلاً: به‌روزرسانی سیستم"
                            value={adminTitle}
                            onChange={(e) => setAdminTitle(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                            disabled={isSending}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">متن پیام</label>
                          <textarea
                            placeholder="جزئیات اعلان را اینجا بنویسید..."
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none transition-all font-sans"
                            disabled={isSending}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">نوع اعلان</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['info', 'success', 'warning', 'error'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setAdminType(type)}
                                className={cn(
                                  "flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black transition-all",
                                  adminType === type 
                                    ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm" 
                                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                                )}
                              >
                                {getIcon(type)}
                                {type === 'info' && 'اطلاعیه'}
                                {type === 'success' && 'موفقیت'}
                                {type === 'warning' && 'هشدار'}
                                {type === 'error' && 'خطا'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSendToAll}
                            disabled={isSending || !adminTitle || !adminMessage}
                            className="flex-3 bg-blue-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSending ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                در حال ارسال...
                              </>
                            ) : (
                              'ارسال نهایی'
                            )}
                          </button>
                          <button
                            onClick={() => setShowAdminPanel(false)}
                            disabled={isSending}
                            className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-xs font-black hover:bg-gray-200 transition-all font-sans"
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-4 border-b border-gray-50 hover:bg-gray-50 transition-all group relative",
                        !n.read && "bg-blue-50/30"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-xs font-bold mb-1", !n.read ? "text-gray-900" : "text-gray-600")}>
                            {n.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                            {n.message}
                          </p>
                          <span className="text-[9px] text-gray-400">
                            {n.timestamp?.toDate ? n.timestamp.toDate().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                            title="علامت به عنوان خوانده شده"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Bell className="mx-auto text-gray-200 mb-2" size={32} />
                    <p className="text-xs text-gray-400">اعلانی وجود ندارد.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
