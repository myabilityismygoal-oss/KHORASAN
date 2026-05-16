import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  GraduationCap, 
  BookOpen, 
  Palette, 
  Users, 
  Globe, 
  Leaf, 
  MessageCircle, 
  HelpCircle, 
  Search as SearchIcon,
  Briefcase,
  Star,
  Gift,
  Plus,
  Book
} from 'lucide-react';
import NewsWidget from './NewsWidget';
import CommandPalette from './CommandPalette';
import Social from './Social';
import { auth, db } from '../firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { Riddle } from '../types';
import { cn } from '../lib/utils';

const Home: React.FC = () => {
  const user = auth.currentUser;
  const [riddles, setRiddles] = useState<Riddle[]>([]);

  useEffect(() => {
    const fetchRiddles = async () => {
      try {
        const q = query(collection(db, 'riddles'), orderBy('createdAt', 'desc'), limit(2));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Riddle));
        setRiddles(data);
      } catch (error) {
        console.error('Error fetching riddles:', error);
      }
    };
    fetchRiddles();
  }, []);

  const categories = [
    { id: 'shop', name: 'فروشگاه', icon: <ShoppingBag size={20} />, path: '/shop', color: 'bg-blue-500' },
    { id: 'education', name: 'آموزش', icon: <GraduationCap size={20} />, path: '/education', color: 'bg-green-500' },
    { id: 'library', name: 'کتابخانه', icon: <BookOpen size={20} />, path: '/library', color: 'bg-amber-500' },
    { id: 'art', name: 'هنر', icon: <Palette size={20} />, path: '/art', color: 'bg-purple-500' },
    { id: 'culture', name: 'فرهنگ', icon: <Globe size={20} />, path: '/culture', color: 'bg-indigo-500' },
    { id: 'qa', name: 'سوال جواب', icon: <HelpCircle size={20} />, path: '/qa', color: 'bg-rose-500' },
    { id: 'wordbank', name: 'لغات', icon: <Book size={20} />, path: '/wordbank', color: 'bg-indigo-500' },
    { id: 'businesses', name: 'کسب‌وکار', icon: <Briefcase size={20} />, path: '/search', color: 'bg-cyan-500' },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Categories as Highlights */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <Link 
            key={cat.id}
            to={cat.path}
            className="shrink-0 flex flex-col items-center gap-1 group"
          >
            <div className={`w-14 h-14 rounded-full ${cat.color} text-white flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition-transform`}>
              {cat.icon}
            </div>
            <span className="text-[10px] font-bold text-gray-500">{cat.name}</span>
          </Link>
        ))}
      </div>

      {/* Main Social Feed */}
      <Social user={user} />

      {/* Secondary Content */}
      <div className="space-y-6 pt-8">
        <NewsWidget />
        
        <div className="glass-card p-6 rounded-2xl border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="text-blue-600" size={20} />
              معماهای بی‌پاسخ
            </h2>
            <Link to="/riddles" className="text-blue-600 text-xs font-bold hover:underline">مشاهده همه</Link>
          </div>
          <div className="space-y-3">
            {riddles.length > 0 ? riddles.map((riddle) => (
              <div key={riddle.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-800 font-medium mb-1">{riddle.question}</p>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold",
                    riddle.isAnswered ? "text-green-500" : "text-gray-400"
                  )}>
                    {riddle.isAnswered ? 'پاسخ داده شده' : 'بدون پاسخ'}
                  </span>
                  <Link to="/riddles" className="text-blue-600 text-[10px] font-bold">مشاهده</Link>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-4">معمایی یافت نشد.</p>
            )}
          </div>
        </div>
      </div>

      <CommandPalette />
    </div>
  );
};

export default Home;
