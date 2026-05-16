import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Bell, Clock, Trash2, Plus, Calendar as CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendNotification } from '../services/notificationService';

interface Reminder {
  id: string;
  userId: string;
  title: string;
  message: string;
  scheduledTime: any;
  createdAt: any;
}

const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState({ title: '', message: '', date: '', time: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      setReminders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newReminder.title) return;
    
    // Combine date and time if both are provided
    let scheduledTime = null;
    if (newReminder.date && newReminder.time) {
      scheduledTime = new Date(`${newReminder.date}T${newReminder.time}`).toISOString();
    }

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'reminders'), {
        userId: auth.currentUser.uid,
        title: newReminder.title,
        message: newReminder.message,
        scheduledTime,
        createdAt: serverTimestamp(),
      });
      
      // Immediately send a notification to demonstrate the "Push" system
      await sendNotification(
        auth.currentUser.uid,
        'یادآور ثبت شد',
        `یادآور "${newReminder.title}"${scheduledTime ? ` برای تاریخ ${newReminder.date} ساعت ${newReminder.time}` : ''} با موفقیت ذخیره شد.`,
        'success',
        'alert'
      );

      setNewReminder({ title: '', message: '', date: '', time: '' });
    } catch (error) {
      console.error('Error adding reminder:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <Clock className="text-blue-600" size={32} />
          یادآورها
        </h1>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Plus className="text-blue-500" size={20} />
          ثبت یادآور جدید
        </h2>
        <form onSubmit={handleAddReminder} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">عنوان یادآور</label>
            <input 
              type="text"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="مثال: چک کردن پیام‌های جدید"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">توضیحات (اختیاری)</label>
            <textarea 
              value={newReminder.message}
              onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
              placeholder="توضیحات بیشتر برای یادآوری..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">تاریخ</label>
              <input 
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">زمان</label>
              <input 
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isAdding}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="animate-spin" size={24} /> : <Clock size={24} />}
            ثبت یادآور
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4">یادآورهای فعال</h3>
        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : reminders.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {reminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">{reminder.title}</h4>
                      {reminder.message && <p className="text-xs text-gray-500 font-bold">{reminder.message}</p>}
                      {reminder.scheduledTime && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-black">
                          <Clock size={10} />
                          <span>{new Date(reminder.scheduledTime).toLocaleDateString('fa-IR')} - {new Date(reminder.scheduledTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(reminder.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Clock size={32} />
              </div>
              <p className="text-gray-400 font-bold italic">هیچ یادآوری ثبت نشده است</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-200" size={24} />
            <h3 className="text-xl font-black">اطلاع‌رسانی هوشمند</h3>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed opacity-90">
            با فعال کردن اعلان‌های مرورگر در بخش تنظیمات، از یادآورهای خود حتی وقتی خارج از برنامه هستید باخبر شوید.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>
    </div>
  );
};

export default Reminders;
