import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Grid, Bookmark, User as UserIcon, Settings, Plus, MessageCircle, Heart, GraduationCap, Building2, History } from 'lucide-react';
import { UserProfile, Course, Post, Order, Product } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, ShoppingBag, Truck, Check, Clock, XCircle } from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile | null;
  courses: Course[];
}

const ProfilePage: React.FC<Props> = ({ user, profile, courses }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged' | 'education' | 'orders' | 'products'>('posts');
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (activeTab === 'posts') fetchUserPosts();
    else if (activeTab === 'saved') fetchSavedPosts();
    else if (activeTab === 'tagged') fetchTaggedPosts();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'products') fetchUserProducts();
    else setLoading(false);
  }, [activeTab, user.uid, profile?.savedPosts]);

  const fetchUserProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Product));
      setUserProducts(data);
    } catch (error) {
      console.error('Error fetching user products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Order));
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Post));
      setPosts(data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    if (!profile?.savedPosts?.length) {
      setSavedPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), where('__name__', 'in', profile.savedPosts.slice(0, 10)));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Post));
      setSavedPosts(data);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaggedPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), where('taggedUsers', 'array-contains', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Post));
      setTaggedPosts(data);
    } catch (error) {
      console.error('Error fetching tagged posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim() || !user || !profile) return;
    
    const updatedInterests = [...(profile.educationProfile?.interests || []), newInterest.trim()];
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'educationProfile.interests': updatedInterests
      });
      setNewInterest('');
    } catch (error) {
      console.error('Error adding interest:', error);
    }
  };

  const handleRemoveInterest = async (interest: string) => {
    if (!user || !profile) return;
    
    const updatedInterests = (profile.educationProfile?.interests || []).filter(i => i !== interest);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'educationProfile.interests': updatedInterests
      });
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  const renderPostGrid = (displayPosts: Post[], emptyMessage: string) => (
    <div className="grid grid-cols-3 gap-1 md:gap-8">
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-sm" />
        ))
      ) : displayPosts.length > 0 ? (
        displayPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm"
          >
            {post.images && post.images.length > 0 ? (
              <img 
                src={post.images[0]} 
                alt="Post" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center p-4 text-center">
                <p className="text-[10px] md:text-xs text-gray-400 line-clamp-3">{post.content}</p>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 text-white font-bold">
              <div className="flex items-center gap-2">
                <Heart size={20} fill="currentColor" />
                <span>{post.likes.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={20} fill="currentColor" />
                <span>{post.comments.length}</span>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="col-span-3 py-20 text-center text-gray-400">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Plus size={32} />
          </div>
          <p className="text-lg font-bold text-gray-900">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-20 px-4">
        <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full p-1 border border-gray-200">
          <img 
            src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} 
            alt={user.displayName || 'User'} 
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 space-y-6 text-center md:text-right">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h2 className="text-xl font-light text-gray-900">{user.displayName || user.email?.split('@')[0]}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button 
                onClick={() => navigate('/education-profile')}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <GraduationCap size={14} />
                پروفایل آموزشی
              </button>
              <button 
                onClick={() => navigate('/business-registration')}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <Building2 size={14} />
                ثبت تجارت
              </button>
              <button 
                onClick={() => navigate('/transactions')}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <History size={14} />
                تراکنش‌ها
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                ویرایش پروفایل
              </button>
              <button 
                onClick={async () => {
                  const { auth } = await import('../firebase');
                  await auth.signOut();
                  navigate('/auth');
                }}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                title="خروج از حساب"
              >
                <XCircle size={14} />
                خروج
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-all">
                <Settings size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12">
            <div className="flex flex-col md:flex-row items-center gap-1">
              <span className="font-bold text-gray-900">{posts.length}</span>
              <span className="text-sm text-gray-500">پست</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-1">
              <span className="font-bold text-gray-900">۱.۲هزار</span>
              <span className="text-sm text-gray-500">دنبال‌کننده</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-1">
              <span className="font-bold text-gray-900">۸۵۰</span>
              <span className="text-sm text-gray-500">دنبال‌شونده</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-900">{user.displayName}</h3>
            <p className="text-sm text-gray-800 leading-relaxed max-w-md mx-auto md:mx-0">
              علاقه‌مند به فرهنگ و هنر خراسان. در حال یادگیری و اشتراک‌گذاری زیبایی‌های این سرزمین. 🇦🇫
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200">
        <div className="flex items-center justify-center gap-12 -mt-[1px]">
          <button 
            onClick={() => setActiveTab('posts')}
            className={cn(
              "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all border-t",
              activeTab === 'posts' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            <Grid size={12} />
            پست‌ها
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={cn(
              "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all border-t",
              activeTab === 'saved' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            <Bookmark size={12} />
            ذخیره شده
          </button>
          <button 
            onClick={() => setActiveTab('tagged')}
            className={cn(
              "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all border-t",
              activeTab === 'tagged' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            <UserIcon size={12} />
            تگ شده
          </button>
          <button 
            onClick={() => setActiveTab('education')}
            className={cn(
              "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all border-t",
              activeTab === 'education' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            <GraduationCap size={12} />
            آموزش
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all border-t",
              activeTab === 'orders' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            )}
          >
            <ShoppingBag size={12} />
            سفارشات
          </button>
          {profile?.role === 'business' && (
            <button 
              onClick={() => setActiveTab('products')}
              className={cn(
                "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all border-t",
                activeTab === 'products' ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
              )}
            >
              <Building2 size={12} />
              محصولات
            </button>
          )}
        </div>

        {/* Content */}
        <div className="pt-4">
          {activeTab === 'orders' ? (
            <div className="max-w-2xl mx-auto space-y-6 py-8">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <ShoppingBag size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">سفارش #{order.id.slice(-6)}</h4>
                          <p className="text-[10px] text-gray-500">
                            {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('fa-IR') : ''}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
                        order.status === 'delivered' ? "bg-green-50 text-green-600" :
                        order.status === 'cancelled' ? "bg-red-50 text-red-600" :
                        "bg-blue-50 text-blue-600"
                      )}>
                        {order.status === 'delivered' ? <Check size={12} /> : 
                         order.status === 'pending' ? <Clock size={12} /> :
                         order.status === 'shipped' ? <Truck size={12} /> :
                         <XCircle size={12} />}
                        {order.status === 'pending' ? 'در انتظار' :
                         order.status === 'processing' ? 'در حال پردازش' :
                         order.status === 'shipped' ? 'ارسال شده' :
                         order.status === 'delivered' ? 'تحویل شده' : 'لغو شده'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{item.name} x {item.quantity} {item.size ? `(${item.size})` : ''}</span>
                          <span className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} افغانی</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="text-[10px] text-gray-500">
                        <p>آدرس: {order.shippingAddress}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">مجموع کل</p>
                        <p className="text-lg font-black text-blue-600">{order.totalAmount.toLocaleString()} افغانی</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">هنوز سفارشی ثبت نکرده‌اید</p>
                  <button 
                    onClick={() => navigate('/shop')}
                    className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                  >
                    مشاهده فروشگاه
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'products' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-8">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-2xl" />
                ))
              ) : userProducts.length > 0 ? (
                userProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="group cursor-pointer space-y-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-50">
                      <img 
                        src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white bg-red-500 px-2 py-1 rounded-full">ناموجود</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{product.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-blue-600">{product.price.toLocaleString()} افغانی</span>
                        <span className="text-[10px] text-gray-400">موجودی: {product.stock}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-gray-400">
                  <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">هنوز محصولی ثبت نکرده‌اید</p>
                  <button 
                    onClick={() => navigate('/shop')}
                    className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                  >
                    افزودن محصول در فروشگاه
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'education' ? (
            <div className="max-w-2xl mx-auto space-y-8 py-8">
              {/* Bio & Interests */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">بیوگرافی آموزشی</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {profile?.educationProfile?.bio || 'هنوز بیوگرافی آموزشی ثبت نشده است.'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">علاقه‌مندی‌ها</h3>
                    <button 
                      onClick={() => setIsEditingInterests(!isEditingInterests)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {isEditingInterests ? 'تکمیل' : 'ویرایش'}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {profile?.educationProfile?.interests?.map(interest => (
                      <span key={interest} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold flex items-center gap-2">
                        {interest}
                        {isEditingInterests && (
                          <button 
                            onClick={() => handleRemoveInterest(interest)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <XCircle size={12} />
                          </button>
                        )}
                      </span>
                    )) || <span className="text-xs text-gray-400">هنوز علاقه‌مندی ثبت نشده است.</span>}
                    
                    {isEditingInterests && (
                      <div className="flex items-center gap-2 mt-2 w-full">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                          placeholder="علاقه‌مندی جدید..."
                          className="flex-1 px-3 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        />
                        <button 
                          onClick={handleAddInterest}
                          className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900">دوره‌های در حال یادگیری</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {profile?.educationProfile?.enrolledCourses?.length || 0} دوره
                  </span>
                </div>

                <div className="space-y-4">
                  {courses.filter(c => profile?.educationProfile?.enrolledCourses?.includes(c.id)).map(course => (
                    <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                        {course.title[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900">{course.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">توسط: {course.instructorId}</p>
                      </div>
                      <button 
                        onClick={() => navigate('/education')}
                        className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-all"
                      >
                        ادامه یادگیری
                      </button>
                    </div>
                  )) || <p className="text-center py-8 text-sm text-gray-400">هنوز در دوره‌ای ثبت‌نام نکرده‌اید.</p>}
                </div>
              </div>

              {/* Completed Lessons */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900">درس‌های تکمیل شده</h3>
                </div>
                
                <div className="space-y-3">
                  {profile?.educationProfile?.completedLessons?.length ? (
                    profile.educationProfile.completedLessons.map((lessonId, index) => (
                      <div key={lessonId} className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium text-gray-700">درس شماره {lessonId}</span>
                        <CheckCircle size={14} className="text-green-500 mr-auto" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">هنوز درسی را به پایان نرسانده‌اید.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'posts' ? (
            renderPostGrid(posts, 'هنوز پستی ندارید')
          ) : activeTab === 'saved' ? (
            renderPostGrid(savedPosts, 'هنوز پستی ذخیره نکرده‌اید')
          ) : activeTab === 'tagged' ? (
            renderPostGrid(taggedPosts, 'هنوز در پستی تگ نشده‌اید')
          ) : (
            <div className="py-20 text-center text-gray-400">
              <p className="text-sm">این بخش به زودی فعال می‌شود.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
