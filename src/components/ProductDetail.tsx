import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight, MessageCircle, Share2, Star, User as UserIcon, Check, MapPin, Phone, Globe, Package, ShieldCheck, Truck, Heart, ShoppingCart, Bell, BellOff, Edit2, Save, X, Loader2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { updateProduct } from '../services/productService';

import { useCart } from '../contexts/CartContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [business, setBusiness] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ price: 0, stock: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchProductAndBusiness = async () => {
      if (!id) return;
      try {
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() } as Product;
          setProduct(productData);
          setEditData({ price: productData.price, stock: productData.stock || 0 });
          
          if (auth.currentUser) {
            setIsLiked(productData.likes?.includes(auth.currentUser.uid) || false);
            
            // Check if user has an alert for this product
            const alertsRef = collection(db, 'productAlerts');
            const q = query(alertsRef, where('userId', '==', auth.currentUser.uid), where('productId', '==', id));
            const alertSnap = await getDocs(q);
            setIsNotified(!alertSnap.empty);
          }

          // Fetch related products
          fetchRelatedProducts(productData.category, id);

          // Fetch owner business profile
          const userRef = doc(db, 'users', productData.ownerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setBusiness(userSnap.data() as UserProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching product detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndBusiness();
  }, [id]);

  const fetchRelatedProducts = async (category: string, currentId: string) => {
    setLoadingRelated(true);
    try {
      const q = query(
        collection(db, 'products'),
        where('category', '==', category),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.id !== currentId)
        .slice(0, 4);
      setRelatedProducts(products);
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser || !product) {
      navigate('/auth');
      return;
    }

    const productRef = doc(db, 'products', product.id);
    try {
      if (isLiked) {
        await updateDoc(productRef, {
          likes: arrayRemove(auth.currentUser.uid)
        });
        setIsLiked(false);
        setProduct({ ...product, likes: (product.likes || []).filter(uid => uid !== auth.currentUser?.uid) });
      } else {
        await updateDoc(productRef, {
          likes: arrayUnion(auth.currentUser.uid)
        });
        setIsLiked(true);
        setProduct({ ...product, likes: [...(product.likes || []), auth.currentUser.uid] });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleAlert = async () => {
    if (!auth.currentUser || !product) {
      navigate('/auth');
      return;
    }

    setAlertLoading(true);
    try {
      const alertsRef = collection(db, 'productAlerts');
      const q = query(alertsRef, where('userId', '==', auth.currentUser.uid), where('productId', '==', product.id));
      const alertSnap = await getDocs(q);

      if (!alertSnap.empty) {
        // Remove alert
        const deletePromises = alertSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        setIsNotified(false);
      } else {
        // Add alert
        await addDoc(alertsRef, {
          userId: auth.currentUser.uid,
          productId: product.id,
          type: 'both',
          createdAt: new Date().toISOString()
        });
        setIsNotified(true);
      }
    } catch (error) {
      console.error('Error toggling product alert:', error);
    } finally {
      setAlertLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!product) return;
    setIsSaving(true);
    try {
      await updateProduct(product.id, {
        price: Number(editData.price),
        stock: Number(editData.stock)
      });
      setProduct({ ...product, price: Number(editData.price), stock: Number(editData.stock) });
      setIsEditing(false);
      alert('تغییرات با موفقیت ذخیره شد و به کاربران اطلاع‌رسانی شد.');
    } catch (error) {
      console.error('Error saving product edits:', error);
      alert('خطا در ذخیره تغییرات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('لطفا ابتدا سایز مورد نظر را انتخاب کنید');
      return;
    }
    addToCart(product, 1, selectedSize || undefined);
  };

  const handleDirectPurchase = () => {
    if (!auth.currentUser) {
      navigate('/auth');
      return;
    }
    if (!product) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('لطفا ابتدا سایز مورد نظر را انتخاب کنید');
      return;
    }
    // Check if item already in cart with this size
    const existing = cart.find(item => item.id === product.id && item.selectedSize === selectedSize);
    if (!existing) {
      addToCart(product, 1, selectedSize || undefined);
    }
    navigate('/checkout');
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: product.description,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">محصول یافت نشد</h2>
        <button onClick={() => navigate('/shop')} className="text-blue-600 font-medium flex items-center gap-2 mx-auto">
          <ArrowRight size={18} />
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back Button */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold text-sm group"
        >
          <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
            <ArrowRight size={18} />
          </div>
          بازگشت
        </button>
        <div className="flex items-center gap-4">
          {auth.currentUser?.uid === product.ownerId && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "p-2 rounded-full transition-all",
                isEditing ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:bg-gray-50"
              )}
              title="ویرایش محصول"
            >
              <Edit2 size={20} />
            </button>
          )}
          <button 
            onClick={handleToggleAlert}
            disabled={alertLoading}
            className={cn(
              "p-2 rounded-full transition-all",
              isNotified ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:bg-gray-50",
              alertLoading && "opacity-50 cursor-wait"
            )}
            title={isNotified ? "غیرفعال‌سازی اعلان" : "فعال‌سازی اعلان تغییرات محصول"}
          >
            {isNotified ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
          <div className="relative">
            <ShoppingCart size={22} className="text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative"
          >
            <img 
              src={product.images[activeImage] || 'https://picsum.photos/seed/product/800/800'} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={handleLike}
              className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg text-red-500 hover:scale-110 transition-all"
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </motion.div>
          
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                    activeImage === idx ? "border-blue-500 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-[10px] font-bold text-gray-400">شناسه: {product.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                <Heart size={14} className="text-red-400" fill="currentColor" />
                {product.likes?.length || 0} نفر علاقه‌مند
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={editData.price}
                      onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                      className="w-24 p-2 border border-blue-200 rounded-lg text-lg font-black outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-lg font-bold text-gray-400">افغانی</span>
                  </div>
                ) : (
                  <>
                    <span className="text-4xl font-black text-blue-600">{product.price}</span>
                    <span className="text-lg font-bold text-gray-400">افغانی</span>
                  </>
                )}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg text-xs font-black flex items-center gap-2",
                (product.stock || 0) > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              )}>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">موجودی:</span>
                    <input 
                      type="number"
                      value={editData.stock}
                      onChange={(e) => setEditData({ ...editData, stock: Number(e.target.value) })}
                      className="w-16 p-1 border border-blue-200 rounded text-center outline-none"
                    />
                  </div>
                ) : (
                  (product.stock || 0) > 0 ? `موجودی: ${product.stock} عدد` : 'ناموجود'
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  ذخیره تغییرات
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  انصراف
                </button>
              </div>
            )}
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-900">انتخاب سایز:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                      selectedSize === size 
                        ? "border-blue-600 bg-blue-50 text-blue-600 shadow-md" 
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-blue-500" />
              توضیحات محصول
            </h3>
            <p className="text-sm text-gray-600 leading-loose whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDirectPurchase}
                disabled={(product.stock || 0) <= 0}
                className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={24} />
                خرید مستقیم
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={(product.stock || 0) <= 0}
                className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={24} />
                افزودن به سبد
              </motion.button>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/messages/${product.ownerId}`)}
                className="flex-1 bg-blue-50 text-blue-600 px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 border-2 border-blue-100 hover:bg-blue-100 transition-all"
              >
                <MessageCircle size={24} />
                گفتگو با فروشنده
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 grow-0 shrink-0",
                  copied ? "bg-green-50 border-green-200 text-green-600" : "bg-white border-gray-100 text-gray-500 hover:border-blue-100 hover:text-blue-600"
                )}
              >
                {copied ? <Check size={24} /> : <Share2 size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Info */}
      {business && (
        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-gray-50 pb-6">
            <h2 className="text-xl font-black text-gray-900">اطلاعات فروشنده</h2>
            <Link 
              to={`/business/${product.ownerId}`}
              className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline"
            >
              مشاهده فروشگاه
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shrink-0">
              {business.businessProfile?.logo ? (
                <img src={business.businessProfile.logo} alt={business.businessProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-3xl">
                  {business.businessProfile?.name[0]}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-gray-900">{business.businessProfile?.name}</h3>
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-black">
                  <Star size={14} fill="currentColor" />
                  {business.businessProfile?.rating.toFixed(1)}
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                {business.businessProfile?.description}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin size={14} />
                  {business.businessProfile?.address}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Phone size={14} />
                  {business.businessProfile?.whatsapp}
                </div>
                {business.businessProfile?.website && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Globe size={14} />
                    {business.businessProfile.website}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      {(loadingRelated || relatedProducts.length > 0) && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900">محصولات مشابه</h2>
            <Link 
              to="/shop" 
              className="text-xs font-bold text-blue-600 hover:scale-105 transition-transform flex items-center gap-1"
            >
              مشاهده همه
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingRelated ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse" />
              ))
            ) : (
              relatedProducts.map(relProduct => (
                <motion.div
                  key={relProduct.id}
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    navigate(`/product/${relProduct.id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={relProduct.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                      alt={relProduct.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[8px] font-black text-blue-600 uppercase">
                      {relProduct.category}
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {relProduct.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600">
                        {relProduct.price} <span className="text-[10px] font-normal text-gray-400">افغانی</span>
                      </span>
                      <div className="flex items-center gap-2">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             addToCart(relProduct, 1);
                           }}
                           className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                           title="افزودن به سبد"
                         >
                           <Plus size={12} />
                         </button>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400">
                          <Heart size={8} className="text-red-400" fill="currentColor" />
                          {relProduct.likes?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
