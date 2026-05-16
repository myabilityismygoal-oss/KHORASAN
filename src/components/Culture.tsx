import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Landmark, Leaf, BookOpen, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface CultureArticle {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  category: 'culture' | 'civilization' | 'environment';
  createdAt: string;
}

const Culture: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as any;
  
  const [articles, setArticles] = useState<CultureArticle[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'culture' | 'civilization' | 'environment'>(
    (categoryParam && ['culture', 'civilization', 'environment'].includes(categoryParam)) ? categoryParam : 'all'
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (categoryParam && ['culture', 'civilization', 'environment'].includes(categoryParam)) {
      setActiveTab(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const q = query(collection(db, 'culture'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CultureArticle));
      setArticles(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesTab = activeTab === 'all' || article.category === activeTab;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'همه', icon: Globe },
    { id: 'culture', label: 'فرهنگ', icon: BookOpen },
    { id: 'civilization', label: 'تمدن', icon: Landmark },
    { id: 'environment', label: 'محیط زیست', icon: Leaf },
  ];

  return (
    <div className="space-y-8 pb-20">
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
        <div className="text-xs font-bold text-gray-400">فرهنگ و تمدن</div>
      </div>

      <div className="text-center space-y-2 pt-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">فرهنگ و تمدن</h1>
        <p className="text-gray-500">کاوش در تاریخ، فرهنگ و محیط زیست خراسان</p>
      </div>

      {/* Search and Tabs */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md py-4 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="جستجو در مقالات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === cat.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Icon size={18} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredArticles.map((article) => (
              <motion.article
                key={article.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={article.imageUrl || `https://picsum.photos/seed/${article.id}/800/600`} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg",
                      article.category === 'culture' ? "bg-purple-500" :
                      article.category === 'civilization' ? "bg-amber-500" : "bg-green-500"
                    )}>
                      {categories.find(c => c.id === article.category)?.label}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                    {article.content}
                  </p>
                  <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {new Date(article.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                    <button className="text-blue-600 text-sm font-bold hover:underline">
                      ادامه مطلب
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Search size={40} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold">مقاله‌ای یافت نشد.</p>
        </div>
      )}
    </div>
  );
};

export default Culture;
