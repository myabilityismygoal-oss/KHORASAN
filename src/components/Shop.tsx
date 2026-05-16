import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, getDocs, orderBy, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Product, UserProfile } from '../types';
import { User } from 'firebase/auth';
import { useCart } from '../contexts/CartContext';
import * as Slider from '@radix-ui/react-slider';
import { ShoppingBag, Search, Filter, ShoppingCart, Heart, Bookmark, Star, ArrowUpDown, MapPin, ArrowRight, X, Trash2, Plus, Minus, Loader2, PackagePlus, Image as ImageIcon, Tag, Hash, Ruler, Building2, Share2, Check, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: User | null;
  profile: UserProfile | null;
}

const Shop: React.FC<Props> = ({ user, profile }) => {
  const navigate = useNavigate();
  const { addToCart, cart, removeFromCart, updateQuantity, totalAmount, checkout } = useCart();
  const [activeView, setActiveView] = useState<'products' | 'businesses'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'price_asc' | 'price_desc'>('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [notifiedProductIds, setNotifiedProductIds] = useState<Set<string>>(new Set());

  // Fetch user notifications
  useEffect(() => {
    if (!user) {
      setNotifiedProductIds(new Set());
      return;
    }

    const q = query(collection(db, 'productAlerts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().productId as string));
      setNotifiedProductIds(ids);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'productAlerts');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLike = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) {
      alert('لطفا برای لایک کردن وارد حساب خود شوید.');
      return;
    }

    const productRef = doc(db, 'products', product.id);
    const isLiked = product.likes?.includes(user.uid);

    try {
      if (isLiked) {
        await updateDoc(productRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(productRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
    }
  };

  const handleToggleNotification = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) {
      alert('لطفا برای دریافت اعلان‌ها وارد حساب خود شوید.');
      return;
    }

    const isNotified = notifiedProductIds.has(product.id);
    
    try {
      if (isNotified) {
        // Remove notification
        const q = query(
          collection(db, 'productAlerts'), 
          where('userId', '==', user.uid),
          where('productId', '==', product.id)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'productAlerts', d.id)));
        await Promise.all(deletePromises);
      } else {
        await addDoc(collection(db, 'productAlerts'), {
          userId: user.uid,
          productId: product.id,
          type: 'both',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'productAlerts');
    }
  };

  // Product Management State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'پوشاک',
    images: '',
    sizes: '',
    stock: ''
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'business') return;

    setIsAdding(true);
    try {
      const productData = {
        ownerId: user.uid,
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        category: newProduct.category,
        images: newProduct.images.split(',').map(img => img.trim()).filter(img => img !== ''),
        sizes: newProduct.sizes.split(',').map(s => s.trim()).filter(s => s !== ''),
        stock: Number(newProduct.stock),
        likes: [],
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'products'), productData);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: 'پوشاک',
        images: '',
        sizes: '',
        stock: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const shareData = {
      title: product.name,
      text: product.description,
      url: `${window.location.origin}/product/${product.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setCopiedProductId(product.id);
        setTimeout(() => setCopiedProductId(null), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const categories = ['همه', 'پوشاک', 'الکترونیک', 'خوراک', 'صنایع دستی', 'کتاب', 'ساخت و ساز', 'عکاسی', 'خدمات', 'سایر'];

  useEffect(() => {
    setLoading(true);
    
    // Always fetch products
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Product));
      setProducts(data);
      if (activeView === 'products') setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      if (activeView === 'products') setLoading(false);
    });

    // Always fetch businesses to show titles on products
    const qBiz = query(collection(db, 'users'), where('role', '==', 'business'));
    const unsubscribeBiz = onSnapshot(qBiz, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() as any } as UserProfile))
        .filter(u => u.businessProfile);
      setBusinesses(data);
      if (activeView === 'businesses') setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      if (activeView === 'businesses') setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeBiz();
    };
  }, [activeView]);

  const filteredProducts = products
    .filter(p => 
      (selectedCategory === 'همه' || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (priceRange.min === '' || p.price >= Number(priceRange.min)) &&
      (priceRange.max === '' || p.price <= Number(priceRange.max))
    )
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const filteredBusinesses = businesses
    .filter(b => 
      (selectedCategory === 'همه' || b.businessProfile?.category === selectedCategory) &&
      (b.businessProfile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.businessProfile?.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.businessProfile?.rating || 0) - (a.businessProfile?.rating || 0);
      }
      // Default to newest (based on createdAt if available, otherwise no change)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Back Button */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md py-2 px-4 -mx-4 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold text-sm group"
        >
          <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
            <ArrowUpDown size={18} className="rotate-180" />
          </div>
          بازگشت
        </button>
        <div className="flex items-center gap-4">
          {profile?.role === 'business' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-xs shadow-lg shadow-green-100"
            >
              <PackagePlus size={18} />
              افزودن محصول
            </button>
          )}
          <button 
            onClick={() => setShowCart(true)}
            className="relative p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
          <div className="text-xs font-bold text-gray-400">فروشگاه</div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                    <PackagePlus size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">افزودن محصول جدید</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
                      <Tag size={12} /> نام محصول
                    </label>
                    <input 
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="مثلا: پیراهن نخی سنتی"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-2">توضیحات</label>
                    <textarea 
                      required
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="توضیحات کامل محصول را اینجا بنویسید..."
                      rows={3}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
                        قیمت (افغانی)
                      </label>
                      <input 
                        type="number"
                        required
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="0"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
                        <Hash size={12} /> موجودی انبار
                      </label>
                      <input 
                        type="number"
                        required
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        placeholder="0"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-2">دسته‌بندی</label>
                    <select 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                    >
                      {categories.filter(c => c !== 'همه').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
                      <Ruler size={12} /> سایزها (با کاما جدا کنید)
                    </label>
                    <input 
                      type="text"
                      value={newProduct.sizes}
                      onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                      placeholder="S, M, L, XL"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
                      <ImageIcon size={12} /> لینک تصاویر (با کاما جدا کنید)
                    </label>
                    <input 
                      type="text"
                      required
                      value={newProduct.images}
                      onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                      placeholder="https://example.com/image1.jpg, ..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={24} /> : 'ثبت محصول'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-blue-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">سبد خرید شما</h2>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingBag size={64} className="opacity-20" />
                    <p className="font-bold">سبد خرید شما خالی است</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                        {item.selectedSize && (
                          <p className="text-[10px] text-gray-500">سایز: {item.selectedSize}</p>
                        )}
                        <p className="text-sm font-black text-blue-600">{item.price.toLocaleString()} افغانی</p>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)}
                              className="p-1 hover:bg-gray-50 rounded text-gray-500"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)}
                              className="p-1 hover:bg-gray-50 rounded text-gray-500"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id, item.selectedSize)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-bold">جمع کل:</span>
                    <span className="text-2xl font-black text-blue-600">{totalAmount.toLocaleString()} افغانی</span>
                  </div>

                  <button 
                    onClick={() => {
                      setShowCart(false);
                      navigate('/checkout');
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    تکمیل فرآیند خرید (پرداخت)
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="pt-4 px-4 -mx-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">فروشگاه</h1>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveView('products')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeView === 'products' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              )}
            >
              محصولات
            </button>
            <button 
              onClick={() => setActiveView('businesses')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeView === 'businesses' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              )}
            >
              کسب‌وکارها
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            {loading && searchTerm && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Loader2 size={16} className="animate-spin text-blue-500" />
              </div>
            )}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در فروشگاه"
              className="w-full pr-10 pl-10 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-0 outline-none transition-all placeholder:text-gray-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center gap-2 relative",
              showFilters ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
            title="فیلترها"
          >
            <Filter size={20} />
            {(priceRange.min || priceRange.max || (selectedCategory !== 'همه' && activeView === 'products')) && (
              <span className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">ترتیب:</span>
            {activeView === 'products' ? (
              <>
                <button 
                  onClick={() => setSortBy('newest')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    sortBy === 'newest' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  )}
                >
                  جدیدترین
                </button>
                <button 
                  onClick={() => setSortBy('price_asc')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    sortBy === 'price_asc' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  )}
                >
                  ارزان‌ترین
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setSortBy('newest')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    sortBy === 'newest' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  )}
                >
                  جدیدترین
                </button>
                <button 
                  onClick={() => setSortBy('rating')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    sortBy === 'rating' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  )}
                >
                  امتیاز
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
                    تنظیمات فیلتر
                  </h3>
                  <button 
                    onClick={() => {
                      setPriceRange({ min: '', max: '' });
                      setSelectedCategory('همه');
                    }}
                    className="text-[10px] text-red-500 font-black hover:underline px-3 py-1 bg-red-50 rounded-full"
                  >
                    پاک کردن همه
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Search by Name */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Search size={14} className="text-blue-500" />
                      جستجوی مستقیم نام
                    </label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="نام محصول یا کسب‌وکار را وارد کنید..."
                        className="w-full pr-10 pl-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                      />
                      {searchTerm && (
                        <button 
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter in Panel */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Tag size={14} className="text-blue-500" />
                      دسته‌بندی (محصولات)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black transition-all border",
                            selectedCategory === cat 
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                              : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <ShoppingBag size={14} className="text-blue-500" />
                      محدوده قیمت (افغانی)
                    </label>
                    
                    <div className="px-2">
                      <Slider.Root
                        className="relative flex items-center select-none touch-none w-full h-5"
                        value={[
                          priceRange.min === '' ? 0 : Number(priceRange.min),
                          priceRange.max === '' ? (products.length > 0 ? Math.max(...products.map(p => p.price)) : 100000) : Number(priceRange.max)
                        ]}
                        max={products.length > 0 ? Math.max(...products.map(p => p.price)) : 100000}
                        step={100}
                        onValueChange={(values) => setPriceRange({ min: values[0].toString(), max: values[1].toString() })}
                      >
                        <Slider.Track className="bg-gray-100 relative grow rounded-full h-[6px]">
                          <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb
                          className="block w-5 h-5 bg-white shadow-xl border-2 border-blue-600 rounded-full hover:bg-blue-50 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-grab"
                          aria-label="Min Price"
                        />
                        <Slider.Thumb
                          className="block w-5 h-5 bg-white shadow-xl border-2 border-blue-600 rounded-full hover:bg-blue-50 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-grab"
                          aria-label="Max Price"
                        />
                      </Slider.Root>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 flex-1">
                        <label className="text-[10px] font-bold text-gray-400 mr-2">از</label>
                        <input 
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          placeholder="حداقل"
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-[10px] font-bold text-gray-400 mr-2">تا</label>
                        <input 
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          placeholder="حداکثر"
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                   <button 
                    onClick={() => setShowFilters(false)}
                    className="px-6 py-2 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all"
                   >
                     اعمال فیلترها
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Category Selector */}
        {!showFilters && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                  selectedCategory === cat 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className={cn(
        "grid gap-6 px-1 md:px-0",
        activeView === 'products' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
      )}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            activeView === 'products' ? (
              <div key={i} className="space-y-3 glass-card p-2 rounded-2xl border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <div className="w-8 h-8 bg-gray-300 rounded-full" />
                    <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  </div>
                </div>
                <div className="px-1 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
                    <div className="h-2 bg-gray-200 rounded-full w-1/2" />
                  </div>
                  <div className="h-3 bg-gray-300 rounded-full w-3/4" />
                  <div className="h-5 bg-gray-300 rounded-full w-1/3" />
                </div>
              </div>
            ) : (
              <div key={i} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden animate-pulse flex flex-col h-full min-h-[320px]">
                <div className="h-32 bg-gray-200 relative">
                  <div className="absolute top-4 left-4 w-12 h-6 bg-gray-300 rounded-full" />
                  <div className="absolute bottom-4 right-20 w-16 h-4 bg-gray-300 rounded-lg" />
                </div>
                <div className="px-6 pb-6 pt-0 relative flex-1">
                  <div className="absolute -top-10 right-6 w-20 h-20 bg-gray-300 rounded-3xl border-4 border-white shadow-xl" />
                  <div className="mt-12 space-y-4">
                    <div className="h-6 bg-gray-300 rounded-full w-1/2" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full w-full" />
                      <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex gap-4">
                      <div className="h-3 bg-gray-200 rounded-full w-1/4" />
                      <div className="h-3 bg-gray-200 rounded-full w-1/4" />
                    </div>
                  </div>
                </div>
              </div>
            )
          ))
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {activeView === 'products' ? (
              filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="group cursor-pointer space-y-3 glass-card p-2 rounded-2xl border-white/10 hover:border-blue-100/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all"
                  >
                    <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-50">
                      <img 
                        src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <button 
                          onClick={(e) => handleLike(e, product)}
                          className="flex items-center gap-1 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 shadow-sm hover:scale-110 transition-all"
                        >
                          <Heart size={12} fill={user && product.likes?.includes(user.uid) ? "currentColor" : "none"} />
                          <span className="text-[10px] font-black">{product.likes?.length || 0}</span>
                        </button>
                        <button 
                          onClick={(e) => handleShare(e, product)}
                          className={cn(
                            "p-1.5 bg-white/90 backdrop-blur-sm rounded-full transition-all shadow-sm flex items-center justify-center",
                            copiedProductId === product.id ? "text-green-500" : "text-gray-400 hover:text-blue-500"
                          )}
                        >
                          {copiedProductId === product.id ? <Check size={12} /> : <Share2 size={12} />}
                        </button>
                        { (product.likes?.length || 0) >= 100 && (
                          <div className="relative group/notification">
                            <button 
                              onClick={(e) => handleToggleNotification(e, product)}
                              className={cn(
                                "p-1.5 backdrop-blur-sm rounded-full transition-all shadow-sm flex items-center justify-center",
                                notifiedProductIds.has(product.id) 
                                  ? "bg-blue-600 text-white" 
                                  : "bg-white/90 text-gray-400 hover:text-blue-500"
                              )}
                            >
                              {notifiedProductIds.has(product.id) ? <Bell size={12} /> : <BellOff size={12} />}
                            </button>
                            <div className="absolute left-full mr-2 top-0 hidden group-hover/notification:block bg-gray-900 text-white text-[8px] font-bold py-1 px-2 rounded whitespace-nowrap z-50">
                              اشتراک در اعلان موجودی و قیمت
                            </div>
                          </div>
                        )}
                      </div>
                      { (product.likes?.length || 0) >= 100 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                          <Star size={10} fill="currentColor" />
                          محبوب
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white">
                          {product.category}
                        </div>
                        {product.stock !== undefined && (
                          <div className={cn(
                            "px-2 py-1 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white",
                            product.stock > 0 ? "bg-green-500/60" : "bg-red-500/60"
                          )}>
                            {product.stock > 0 ? 'موجود' : 'ناموجود'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-1 space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                          {businesses.find(b => b.uid === product.ownerId)?.businessProfile?.logo ? (
                            <img src={businesses.find(b => b.uid === product.ownerId)?.businessProfile?.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={10} className="text-gray-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 truncate">
                          {businesses.find(b => b.uid === product.ownerId)?.businessProfile?.name || 'فروشنده'}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-blue-600">{product.price.toLocaleString()} <span className="text-[10px] font-bold text-gray-400">افغانی</span></p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1);
                          }}
                          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                          title="افزودن به سبد"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  key="empty-products" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-24 text-center text-gray-400 space-y-4"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <ShoppingBag size={48} />
                  </div>
                  <p className="font-bold italic">محصولی یافت نشد.</p>
                </motion.div>
              )
            ) : (
              filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((biz) => (
                  <motion.div
                    key={biz.uid}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/business/${biz.uid}`)}
                    className="group cursor-pointer bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex flex-col"
                  >
                    {/* Cover Image */}
                    <div className="h-32 relative bg-gray-100 overflow-hidden">
                      <img 
                        src={biz.businessProfile?.photos?.[0] || `https://picsum.photos/seed/${biz.uid}/800/400`} 
                        alt="Cover" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm text-yellow-600 rounded-full text-xs font-black shadow-lg">
                        <Star size={14} fill="currentColor" />
                        {biz.businessProfile?.rating.toFixed(1)}
                      </div>
    
                      {/* Category Badge */}
                      <div className="absolute bottom-4 right-20 px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                        {biz.businessProfile?.category}
                      </div>
                    </div>
    
                    {/* Profile Info */}
                    <div className="px-6 pb-6 pt-0 relative flex-1">
                      {/* Logo */}
                      <div className="absolute -top-10 right-6 w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl z-10 flex items-center justify-center text-gray-200">
                        {biz.businessProfile?.logo ? (
                          <img src={biz.businessProfile.logo} alt={biz.businessProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                        ) : biz.businessProfile?.name ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-3xl bg-gradient-to-br from-gray-50 to-gray-100">
                            {biz.businessProfile.name[0]}
                          </div>
                        ) : null}
                      </div>
    
                      <div className="mt-12 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {biz.businessProfile?.name}
                          </h3>
                        </div>
                        
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 font-medium h-10">
                          {biz.businessProfile?.description}
                        </p>
    
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                              <MapPin size={12} className="text-red-400" />
                              {biz.businessProfile?.address}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                              {biz.businessProfile?.isOnline ? (
                                <div className="flex items-center gap-1 text-green-500">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                  آنلاین
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-500">
                                  <Building2 size={12} />
                                  فیزیکی
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  key="empty-businesses" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-24 text-center text-gray-400 space-y-4"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <Building2 size={48} />
                  </div>
                  <p className="font-bold italic">کسب‌وکاری یافت نشد.</p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Shop;
