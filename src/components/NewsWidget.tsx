import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ArrowLeft, Clock, TrendingUp, Bell } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  createdAt: string;
  imageUrl?: string;
}

const NewsWidget: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking news for now, but setting up the listener for real data
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      if (data.length > 0) {
        setNews(data);
      } else {
        // Default news if collection is empty
        setNews([
          {
            id: '1',
            title: 'راه‌اندازی توکن عشقری در پلتفرم خراسان',
            summary: 'از امروز کاربران می‌توانند با استفاده از توکن عشقری تمام تراکنش‌های خود را انجام دهند.',
            category: 'اطلاعیه',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'بخش جدید آموزش با هوش مصنوعی فعال شد',
            summary: 'دستیار هوشمند خراسان آماده پاسخگویی به سوالات درسی و علمی شماست.',
            category: 'آموزش',
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'فراخوان ثبت کسب‌وکارهای محلی',
            summary: 'صاحبان کسب‌وکارهای کوچک می‌توانند پروفایل تجاری خود را به رایگان ثبت کنند.',
            category: 'تجارت',
            createdAt: new Date().toISOString(),
          }
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-700">
          <Newspaper size={20} className="animate-pulse" />
          <h3 className="font-bold text-sm">آخرین اخبار و اطلاعیه‌ها</h3>
        </div>
        <TrendingUp size={16} className="text-blue-400" />
      </div>
      
      <div className="divide-y divide-gray-100">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock size={10} />
                    <span>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-gray-300 group-hover:text-blue-500 group-hover:border-blue-200 transition-all">
                <ArrowLeft size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
        مشاهده تمام اخبار
        <ArrowLeft size={14} />
      </button>
    </div>
  );
};

export default NewsWidget;
