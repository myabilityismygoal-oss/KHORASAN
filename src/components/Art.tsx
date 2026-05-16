import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, where, addDoc, serverTimestamp, limit, onSnapshot } from 'firebase/firestore';
import { ArtPiece, Review } from '../types';
import { Palette, Grid, List, Search, Heart, MessageCircle, Star, Share2, Filter, ChevronRight, Loader2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Art: React.FC = () => {
  const [artPieces, setArtPieces] = useState<ArtPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArt, setSelectedArt] = useState<ArtPiece | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [copiedArtId, setCopiedArtId] = useState<string | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);

  const categories = ['همه', 'خدمات', 'نقاشی', 'عکاسی', 'مجسمه‌سازی', 'دیجیتال', 'خطاطی'];

  useEffect(() => {
    let q = query(collection(db, 'art'), orderBy('createdAt', 'desc'), limit(20));
    if (selectedCategory !== 'همه') {
      q = query(collection(db, 'art'), where('category', '==', selectedCategory), orderBy('createdAt', 'desc'), limit(20));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as ArtPiece));
      
      if (data.length === 0 && selectedCategory === 'همه') {
        // Mock data if collection is empty
        setArtPieces([
          {
            id: '1',
            title: 'غروب در کویر',
            artist: 'احمد رضایی',
            imageUrl: 'https://picsum.photos/seed/art1/800/800',
            description: 'نمایشی از زیبایی‌های کویر در هنگام غروب آفتاب.',
            likes: 124,
            category: 'نقاشی',
            price: 12500,
            createdAt: new Date()
          },
          {
            id: '2',
            title: 'سکوت شهر',
            artist: 'سارا محمدی',
            imageUrl: 'https://picsum.photos/seed/art2/800/1000',
            description: 'عکاسی خیابانی از لحظات آرام شهر.',
            likes: 89,
            category: 'عکاسی',
            price: 8000,
            createdAt: new Date()
          }
        ]);
      } else {
        setArtPieces(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching art:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedArt) return;

    const q = query(collection(db, 'reviews'), where('targetId', '==', selectedArt.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Review));
      setReviews(data);
    }, (error) => {
      console.error('Error fetching reviews:', error);
    });

    return () => unsubscribe();
  }, [selectedArt]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArt || !newReview.comment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        targetId: selectedArt.id,
        authorId: 'anonymous',
        authorName: 'کاربر مهمان',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp(),
        type: 'art'
      });
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = async (e: React.MouseEvent | React.FocusEvent | null, art: ArtPiece, isModal: boolean = false) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    
    const shareData = {
      title: art.title,
      text: art.description,
      url: `${window.location.origin}/art?id=${art.id}` // Assuming a way to deep link, though Art.tsx handles modal via state. 
      // Optimized for current structure:
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const url = `${window.location.origin}/art?id=${art.id}`;
        await navigator.clipboard.writeText(url);
        if (isModal) {
          setCopiedModal(true);
          setTimeout(() => setCopiedModal(false), 2000);
        } else {
          setCopiedArtId(art.id);
          setTimeout(() => setCopiedArtId(null), 2000);
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const filteredArt = artPieces.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-4 px-4 -mx-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="text-pink-500" size={24} />
            <h1 className="text-xl font-bold text-gray-900">بخش هنر</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="جستجو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 pl-4 py-1.5 bg-gray-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-gray-900" : "text-gray-400")}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-400")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                selectedCategory === cat 
                  ? "bg-pink-500 border-pink-500 text-white" 
                  : "bg-white border-gray-200 text-gray-600 hover:border-pink-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Art Gallery */}
      <div className={cn(
        "grid gap-4 px-2 md:px-0",
        viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
      )}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-xl" />
          ))
        ) : filteredArt.map((art) => (
          <motion.div
            key={art.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSelectedArt(art)}
            className={cn(
              "group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer",
              viewMode === 'list' && "flex flex-col md:flex-row"
            )}
          >
            <div className={cn(
              "relative overflow-hidden bg-gray-50",
              viewMode === 'grid' ? "aspect-square" : "w-full md:w-64 aspect-video md:aspect-square"
            )}>
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                <div className="flex items-center gap-1">
                  <Heart size={20} fill="currentColor" />
                  <span className="font-bold">{art.likes}</span>
                </div>
                <MessageCircle size={20} fill="currentColor" />
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-[10px] font-bold text-pink-600">
                {art.category}
              </div>
            </div>

            <div className="p-4 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-pink-600 transition-colors">{art.title}</h3>
                  <p className="text-xs text-gray-500">اثر {art.artist}</p>
                </div>
                {art.price && (
                  <span className="text-xs font-bold text-pink-600">{art.price.toLocaleString()} افغانی</span>
                )}
              </div>
              {viewMode === 'list' && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{art.description}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArt(art);
                  }}
                  className="text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors"
                >
                  مشاهده جزئیات
                </button>
                <button 
                  onClick={(e) => handleShare(e, art)}
                  className={cn(
                    "p-1.5 rounded-full transition-all flex items-center justify-center",
                    copiedArtId === art.id ? "text-green-500 bg-green-50" : "text-gray-400 hover:bg-gray-100"
                  )}
                >
                  {copiedArtId === art.id ? <Check size={16} /> : <Share2 size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Art Detail Modal */}
      <AnimatePresence>
        {selectedArt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArt(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="md:w-1/2 bg-gray-100">
                <img 
                  src={selectedArt.imageUrl} 
                  alt={selectedArt.title} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="md:w-1/2 p-8 overflow-y-auto space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedArt.title}</h2>
                    <button onClick={() => setSelectedArt(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                        {selectedArt.artist[0]}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{selectedArt.artist}</span>
                    </div>
                    <span className="text-xs text-gray-400">|</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Palette size={14} className="text-pink-500" />
                      {selectedArt.category}
                    </div>
                    <span className="text-xs text-gray-400">|</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Heart size={14} className="text-red-500" fill="currentColor" />
                      {selectedArt.likes} علاقه
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedArt.description}
                  </p>
                  {selectedArt.price && (
                    <div className="flex items-center justify-between p-4 bg-pink-50 rounded-2xl">
                      <span className="text-sm font-bold text-pink-900">قیمت اثر:</span>
                      <span className="text-xl font-bold text-pink-600">{selectedArt.price.toLocaleString()} افغانی</span>
                    </div>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="space-y-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle size={20} />
                    نظرات و امتیازات
                  </h3>

                  {/* Add Review Form */}
                  <form onSubmit={handleReviewSubmit} className="space-y-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={cn(
                            "transition-all",
                            star <= newReview.rating ? "text-yellow-400" : "text-gray-300"
                          )}
                        >
                          <Star size={20} fill={star <= newReview.rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="نظر خود را درباره این اثر بنویسید..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-500 transition-all h-24"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !newReview.comment.trim()}
                      className="w-full py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingReview ? <Loader2 className="animate-spin" size={16} /> : 'ثبت نظر'}
                    </button>
                  </form>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="space-y-2 pb-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{review.authorName}</span>
                          <div className="flex items-center gap-1 text-yellow-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-pink-600 transition-all">
                    خرید اثر
                  </button>
                  <button 
                    onClick={(e) => handleShare(e, selectedArt, true)}
                    className={cn(
                      "p-3 border rounded-2xl transition-all",
                      copiedModal ? "bg-green-50 border-green-200 text-green-600" : "border-gray-200 hover:bg-gray-50 text-gray-400"
                    )}
                  >
                    {copiedModal ? <Check size={20} /> : <Share2 size={20} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Art;
