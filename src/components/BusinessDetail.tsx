import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, getDocs, addDoc, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { BusinessProfile, Product, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Tag, Briefcase, ArrowRight, MessageCircle, Share2, Globe, Star, Send, User as UserIcon, Check, ExternalLink, ShoppingBag, Info, X, Smartphone, ChevronLeft, ChevronRight, Clock, Calendar, Map as MapIcon, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'reviews'>('products');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!id) return;
      try {
        // Try fetching from users collection
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.businessProfile) {
            setBusiness({
              id: userSnap.id,
              ownerId: userSnap.id,
              ...userData, // Include top-level fields like location, email
              ...userData.businessProfile // Override with business profile specialized fields
            });
            fetchReviews(userSnap.id);
            fetchProducts(userSnap.id);
            return;
          }
        }

        // Fallback to businesses collection
        const docRef = doc(db, 'businesses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() });
          fetchReviews(docSnap.id);
          fetchProducts(docSnap.id);
        }
      } catch (error) {
        console.error('Error fetching business:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessData();
  }, [id]);

  const fetchProducts = async (businessId: string) => {
    try {
      const q = query(
        collection(db, 'products'), 
        where('ownerId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Product));
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchReviews = async (businessId: string) => {
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Review));
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSendSMS = () => {
    if (!business?.whatsapp) return;
    const confirmed = window.confirm("آیا می‌خواهید برنامه پیامک گوشی شما باز شود؟");
    if (confirmed) {
      window.location.href = `sms:${business.whatsapp}?body=سلام، من از اپلیکیشن خراسان با شما تماس می‌گیرم.`;
    }
  };

  const handleShare = async () => {
    if (!business) return;
    const shareData = {
      title: business.name,
      text: business.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !business || !newReview.trim()) return;

    setSubmitting(true);
    try {
      const reviewData = {
        businessId: business.id || business.ownerId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'کاربر',
        userPhoto: auth.currentUser.photoURL,
        rating,
        comment: newReview,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      setNewReview('');
      setRating(5);
      fetchReviews(business.id || business.ownerId);
    } catch (error) {
      console.error('Error adding review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextImage = () => {
    if (!business.photos) return;
    setActiveImageIndex((prev) => (prev + 1) % business.photos.length);
  };

  const prevImage = () => {
    if (!business.photos) return;
    setActiveImageIndex((prev) => (prev - 1 + business.photos.length) % business.photos.length);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full shadow-lg"
        />
        <p className="text-gray-400 font-bold text-sm animate-pulse italic">در حال دریافت اطلاعات کسب‌وکار...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-20 px-6 max-w-sm mx-auto space-y-6">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
          <Briefcase size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900">کسب‌وکار یافت نشد</h2>
          <p className="text-gray-500 font-medium text-sm">متأسفانه کسب‌وکار مورد نظر پیدا نشد یا از سیستم حذف شده است.</p>
        </div>
        <button onClick={() => navigate('/shop')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
          <ArrowRight size={20} />
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Interactive Gallery Header */}
      <div className="relative group shadow-2xl rounded-[3rem] overflow-hidden">
        <div className="relative h-64 md:h-96">
          <AnimatePresence mode="wait">
            <motion.img 
              key={activeImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              src={business.photos?.[activeImageIndex] || 'https://picsum.photos/seed/biz-bg/1200/600'} 
              alt={`${business.name} - image ${activeImageIndex + 1}`} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Navigation Controls */}
          {business.photos && business.photos.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={prevImage}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-gray-900 transition-all shadow-xl"
                >
                  <ChevronRight size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-gray-900 transition-all shadow-xl"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>

              {/* Thumbnail Bar */}
              <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 px-6 z-20 overflow-x-auto py-2 no-scrollbar">
                {business.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 shrink-0 transition-all overflow-hidden",
                      activeImageIndex === index ? "border-blue-500 scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </>
          )}

          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-gray-900 transition-all shadow-xl border border-white/20 z-10"
          >
            <ArrowRight size={24} />
          </button>

          <div className="absolute bottom-8 right-8 flex items-end gap-4 md:gap-6 z-10">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-[2rem] p-1 shadow-2xl border-4 border-white overflow-hidden shrink-0">
               {business.logo ? (
                <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-[1.5rem]" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-300 font-black text-4xl md:text-5xl">
                  {business.name[0]}
                </div>
              )}
            </div>
            <div className="pb-2 text-white space-y-1">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-xl line-clamp-1">{business.name}</h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] md:text-xs font-black border border-white/30 uppercase tracking-widest whitespace-nowrap">
                  {business.category}
                </span>
                <div className="flex items-center gap-1 text-yellow-400 font-black">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm">{business.rating?.toFixed(1) || '5.0'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 hidden md:flex items-center gap-3 z-10">
             <Link
                  to={`/messages/${id}`}
                  className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                >
                  <MessageCircle size={20} />
                  ارسال پیام
                </Link>
                <button 
                  onClick={handleShare}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-gray-900 transition-all border border-white/20"
                >
                  <Share2 size={20} />
                </button>
          </div>
        </div>
      </div>

      {/* Tabs / Navigation */}
      <div className="flex items-center gap-4 border-b border-gray-100 px-4 md:px-0">
        <button 
          onClick={() => setActiveTab('products')}
          className={cn(
            "py-4 font-black transition-all border-b-4",
            activeTab === 'products' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-900"
          )}
        >
          محصولات ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('info')}
          className={cn(
            "py-4 font-black transition-all border-b-4",
            activeTab === 'info' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-900"
          )}
        >
          درباره و تماس
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={cn(
            "py-4 font-black transition-all border-b-4",
            activeTab === 'reviews' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-900"
          )}
        >
          نظرات ({reviews.length})
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-6"
          >
            {products.length > 0 ? (
              products.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="group cursor-pointer bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:border-blue-100 hover:shadow-xl transition-all"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-50">
                    <img 
                      src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black text-blue-600 shadow-sm">
                      {product.price} توکن
                    </div>
                  </div>
                  <div className="p-5 text-right space-y-1">
                    <h3 className="font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 justify-end">
                      <Tag size={10} />
                      {product.category}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                  <ShoppingBag size={32} />
                </div>
                <p className="text-gray-400 font-bold italic">هنوز هیچ محصولی ثبت نشده است.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  درباره ما
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {business.description || "توضیحاتی برای این کسب‌وکار ثبت نشده است."}
                </p>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-2">
                  {business.isOnline && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 text-[10px] font-black uppercase tracking-wider">
                      <ShoppingBag size={14} />
                      فروشگاه آنلاین
                    </div>
                  )}
                  {business.isPhysical && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-[10px] font-black uppercase tracking-wider">
                      <Briefcase size={14} />
                      خرید حضوری
                    </div>
                  )}
                </div>
                
                <div className="pt-6 border-t border-gray-50 flex flex-wrap gap-3">
                  <a 
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] bg-green-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-100"
                  >
                    <Phone size={20} />
                    واتس‌اپ
                  </a>
                  <button 
                    onClick={() => navigate(`/messages/${id}`)}
                    className="flex-1 min-w-[120px] bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-sm overflow-hidden whitespace-nowrap"
                  >
                    <MessageCircle size={18} />
                    پیام داخلی
                  </button>
                  <button 
                    onClick={handleSendSMS}
                    className="flex-1 min-w-[120px] bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm overflow-hidden whitespace-nowrap"
                  >
                    <Smartphone size={18} />
                    ارسال SMS
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                 <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <Clock className="text-indigo-600" size={24} />
                  ساعات کاری
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-indigo-600" />
                      <span className="text-sm font-black">وضعیت فعلی</span>
                    </div>
                    {business.hours ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        باز است
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-gray-200 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest">نامشخص</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 leading-relaxed italic">
                      {business.hours || "ساعات کاری برای این کسب‌وکار ثبت نشده است. لطفاً مستقیماً تماس بگیرید."}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 px-2">
                      <Info size={12} />
                      تعطیلات رسمی ممکن است ساعات کاری تغییر کند.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                 <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <MapPin className="text-blue-600" size={24} />
                  آدرس و مکان
                </h2>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <p className="text-sm font-bold text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {business.address}
                    </p>
                    {business.detailedAddress && (
                      <div className="flex items-start gap-2 px-4 py-1">
                        <ArrowRight size={14} className="text-blue-200 shrink-0 mt-1" />
                        <p className="text-xs text-gray-500 font-medium">
                          {business.detailedAddress}
                        </p>
                      </div>
                    )}
                   </div>
                  
                  {business.location?.lat && business.location?.lng && (
                    <a 
                      href={`https://www.google.com/maps?q=${business.location.lat},${business.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group border border-emerald-100"
                    >
                      <div className="flex items-center gap-3">
                        <MapIcon size={18} />
                        <span className="text-sm font-black">مشاهده روی نقشه</span>
                      </div>
                      <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  )}

                  {business.website && (
                    <a 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all group border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <Globe size={18} />
                        <span className="text-sm font-black">وب‌سایت رسمی</span>
                      </div>
                      <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-200" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-50">خراسان تراست</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black">کسب‌وکار برگزیده</h3>
                    <p className="text-xs text-blue-100 leading-relaxed opacity-90 font-medium">این کسب‌وکار تمام مراحل احراز هویت و امنیت پلتفرم را با موفقیت سپری کرده است.</p>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl translate-x-1/4 translate-y-1/4" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             {/* Review Form - only if not business owner */}
             {auth.currentUser && auth.currentUser.uid !== (business.id || business.ownerId) && (
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-900">ثبت نظر جدید</h3>
                    <div className="flex gap-1 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setRating(s)} className={cn("transition-all", rating >= s ? "text-yellow-500 scale-110" : "text-gray-200")}>
                          <Star size={24} fill={rating >= s ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={handleSubmitReview} className="relative group">
                    <textarea 
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="نظر خود را درباره این کسب‌وکار بنویسید..."
                      className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-32 resize-none"
                    />
                    <button 
                      type="submit"
                      disabled={submitting || !newReview.trim()}
                      className="absolute bottom-4 left-4 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? 'در حال ارسال...' : 'ثبت نظر'}
                      <Send size={16} />
                    </button>
                  </form>
               </div>
             )}

             <div className="space-y-4">
               {reviews.length > 0 ? (
                 reviews.map(review => (
                   <motion.div 
                    layout
                    key={review.id} 
                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex gap-4"
                   >
                     <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                       {review.userPhoto ? (
                         <img src={review.userPhoto} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <UserIcon className="text-blue-500" size={24} />
                       )}
                     </div>
                     <div className="flex-1 space-y-1">
                       <div className="flex items-center justify-between">
                         <h4 className="font-black text-gray-900">{review.userName}</h4>
                         <div className="flex items-center text-yellow-500 gap-0.5">
                           {Array.from({ length: 5 }).map((_, i) => (
                             <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                           ))}
                         </div>
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold">{review.createdAt?.toDate().toLocaleDateString('fa-IR')}</p>
                       <p className="text-gray-600 text-sm leading-relaxed mt-2 font-medium">{review.comment}</p>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                      <MessageCircle size={32} />
                    </div>
                    <p className="text-gray-400 font-bold italic">هنوز هیچ نظری ثبت نشده است.</p>
                 </div>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Call Bar (Mobile) */}
      <div className="fixed bottom-24 left-4 right-4 z-50 md:hidden animate-in fade-in slide-in-from-bottom-10 h-16 flex gap-3">
        <a 
          href={`https://wa.me/${business.whatsapp}`}
          className="flex-3 h-full bg-green-500 text-white rounded-3xl flex items-center justify-center gap-2 font-black text-sm shadow-2xl shadow-green-200 hover:bg-green-600 transition-all px-4"
        >
          <Phone size={20} />
          واتس‌اپ
        </a>
        <button 
          onClick={handleSendSMS}
          className="flex-2 h-full bg-indigo-600 text-white rounded-3xl flex items-center justify-center gap-2 font-black text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all px-4"
        >
          <Smartphone size={20} />
          SMS
        </button>
      </div>
    </div>
  );
};

export default BusinessDetail;
