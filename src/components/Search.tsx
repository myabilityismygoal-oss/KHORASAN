import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Search as SearchIcon, 
  Heart,
  MessageCircle,
  Play,
  Layers
} from 'lucide-react';
import { Post } from '../types';
import { cn } from '../lib/utils';

const Search: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Post));
      setPosts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching explore posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* Search Bar */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4">
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو"
            className="w-full pr-10 pl-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-0 outline-none transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Explore Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-1">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse" />
          ))
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => {
            // Instagram-like irregular grid logic
            const isLarge = index % 10 === 0 || index % 10 === 6;
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "relative group cursor-pointer overflow-hidden",
                  isLarge ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                )}
              >
                {post.images && post.images.length > 0 ? (
                  <img 
                    src={post.images[0]} 
                    alt="Explore" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center p-4 text-center border border-gray-100">
                    <p className="text-[10px] md:text-xs text-gray-400 line-clamp-4">{post.content}</p>
                  </div>
                )}

                {/* Icons for content type */}
                <div className="absolute top-2 left-2 text-white drop-shadow-md">
                  {post.images && post.images.length > 1 && <Layers size={16} />}
                  {/* If we had video flag: <Play size={16} fill="currentColor" /> */}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 text-white font-bold text-sm">
                  <div className="flex items-center gap-1">
                    <Heart size={18} fill="currentColor" />
                    <span>{post.likes.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={18} fill="currentColor" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-3 py-20 text-center text-gray-400">
            <p>نتیجه‌ای یافت نشد.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
