import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, where, onSnapshot } from 'firebase/firestore';
import { Book } from '../types';
import { BookOpen, Palette, Globe, Leaf, Search, Bookmark, ChevronLeft, X, Share2, Info, ExternalLink, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'books' | 'art' | 'culture' | 'environment' | 'services'>('services');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'books'), 
      where('category', '==', activeTab),
      orderBy('title', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Book));
      setBooks(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching books:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'all', name: 'همه', icon: <BookOpen size={20} /> },
    { id: 'services', name: 'خدمات', icon: <Briefcase size={20} /> },
    { id: 'books', name: 'کتاب‌ها', icon: <BookOpen size={20} /> },
    { id: 'art', name: 'هنر', icon: <Palette size={20} /> },
    { id: 'culture', name: 'فرهنگ', icon: <Globe size={20} /> },
    { id: 'environment', name: 'طبیعت', icon: <Leaf size={20} /> },
  ];

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
  };

  const handleCloseDetail = () => {
    setSelectedBook(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-4 px-4 -mx-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">کتابخانه</h1>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "p-1 rounded-full transition-all",
              showSearch ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-900"
            )}
          >
            <Search size={22} />
          </button>
        </div>
        
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative mt-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در کتابخانه..."
                  className="w-full pr-10 pl-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-0 outline-none transition-all placeholder:text-gray-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-gray-100 -mx-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 py-3 px-4 transition-all border-b-2",
              activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-bold">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6 pt-4"
        >
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-2xl" />
              ))
            ) : filteredBooks.length > 0 ? (
              filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleBookClick(book)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group flex cursor-pointer hover:border-gray-300 transition-all"
                >
                  <div className="w-32 h-44 shrink-0 relative overflow-hidden bg-gray-50">
                    <img 
                      src={book.coverImage || 'https://picsum.photos/seed/book/400/600'} 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <button className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-900 opacity-0 group-hover:opacity-100 transition-all">
                      <Bookmark size={14} />
                    </button>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 text-base line-clamp-1">{book.title}</h3>
                      <p className="text-blue-600 text-xs font-medium">{book.author}</p>
                      <p className="text-gray-500 text-[10px] line-clamp-3 leading-relaxed">{book.description}</p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-gray-900 text-white rounded-xl text-[10px] font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                      مطالعه
                      <ChevronLeft size={12} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">محتوایی یافت نشد.</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetail}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col pt-2"
            >
              {/* Modal Drag Handle (Visual only) */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2 shrink-0 sm:hidden" />
              
              <div className="overflow-y-auto px-6 pb-8 pt-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Info size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">جزئیات {tabs.find(t => t.id === activeTab)?.name}</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedBook.title}</h2>
                    <p className="text-gray-500 font-bold">{selectedBook.author}</p>
                  </div>
                  <button 
                    onClick={handleCloseDetail}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Visual Representation */}
                  <div className="aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden relative group">
                    <img 
                      src={selectedBook.coverImage || 'https://picsum.photos/seed/book/800/1000'} 
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-gray-900 px-1 border-r-2 border-blue-500 pr-2">درباره کتاب</h4>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify px-1 whitespace-pre-wrap">{selectedBook.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-gray-200">
                      <BookOpen size={18} />
                      شروع مطالعه
                    </button>
                    <button className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-100 text-gray-900 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">
                      <Bookmark size={18} />
                      ذخیره
                    </button>
                  </div>

                  <div className="pt-4 flex items-center justify-center gap-6">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors">
                      <Share2 size={16} />
                      اشتراک‌گذاری
                    </button>
                    {selectedBook.contentUrl && (
                      <a 
                        href={selectedBook.contentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors"
                      >
                        <ExternalLink size={16} />
                        دانلود مستقیم
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Library;
