import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import { UserProfile, Product } from '../types';
import { Building2, Camera, Video, MapPin, Phone, Globe, Check, Loader2, Store, Monitor, Package, Plus, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  user: User;
  profile: UserProfile | null;
}

const BusinessRegistration: React.FC<Props> = ({ user, profile }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeView, setActiveView] = useState<'profile' | 'products'>('profile');
  
  const [formData, setFormData] = useState({
    name: profile?.businessProfile?.name || '',
    description: profile?.businessProfile?.description || '',
    address: profile?.businessProfile?.address || '',
    whatsapp: profile?.businessProfile?.whatsapp || '',
    category: profile?.businessProfile?.category || 'General',
    website: profile?.businessProfile?.website || '',
    isOnline: profile?.businessProfile?.isOnline ?? true,
    isPhysical: profile?.businessProfile?.isPhysical ?? false,
    logo: profile?.businessProfile?.logo || '',
  });

  // Product Management State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'General',
    imageUrl: '',
    stock: '0',
    sizes: ''
  });

  useEffect(() => {
    if (activeView === 'products') {
      fetchUserProducts();
    }
  }, [activeView, user.uid]);

  const fetchUserProducts = async () => {
    setProductsLoading(true);
    try {
      const q = query(
        collection(db, 'products'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const d = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(d);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const businessData = {
        ...formData,
        photos: profile?.businessProfile?.photos || [],
        videos: profile?.businessProfile?.videos || [],
        rating: profile?.businessProfile?.rating || 5.0,
      };

      await updateDoc(doc(db, 'users', user.uid), {
        businessProfile: businessData,
        role: 'business'
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = {
        ownerId: user.uid,
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        category: newProduct.category,
        images: [newProduct.imageUrl],
        stock: Number(newProduct.stock),
        sizes: newProduct.sizes.split(',').map(s => s.trim()).filter(s => s !== ''),
        likes: [],
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'products'), productData);
      setIsAddProductModalOpen(false);
      setNewProduct({ name: '', description: '', price: '', category: 'General', imageUrl: '', stock: '0', sizes: '' });
      fetchUserProducts();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('آیا از حذف این محصول اطمینان دارید؟')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchUserProducts();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveView('profile')}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeView === 'profile' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Building2 size={18} />
          پروفایل تجاری
        </button>
        <button
          onClick={() => setActiveView('products')}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeView === 'products' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Package size={18} />
          مدیریت محصولات
        </button>
      </div>

      {activeView === 'profile' ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ثبت و مدیریت تجارت</h2>
              <p className="text-sm text-gray-500">مشخصات شرکت و برند خود را برای عموم منتشر کنید</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">لوگو برند (لینک تصویر)</label>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-gray-300" />
                  )}
                </div>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all text-xs"
                  placeholder="لینک لوگوی خود را اینجا وارد کنید..."
                />
              </div>
            </div>

            {/* Branding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">نام تجاری / برند</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                  placeholder="نام شرکت شما"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">دسته‌بندی</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                >
                  <option value="سایر">عمومی</option>
                  <option value="الکترونیک">تکنولوژی</option>
                  <option value="آموزشی">آموزشی</option>
                  <option value="خوراک">مواد غذایی</option>
                  <option value="پوشاک">پوشاک</option>
                  <option value="ساخت و ساز">ساخت و ساز</option>
                  <option value="عکاسی">عکاسی</option>
                  <option value="خدمات">خدمات</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">توضیحات فعالیت</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all h-32"
                placeholder="درباره خدمات و محصولات خود توضیح دهید..."
              />
            </div>

            {/* Contact & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Phone size={16} className="text-green-500" />
                  واتساپ نمایندگی
                </label>
                <input
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                  placeholder="مثلا: 0799123456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Globe size={16} className="text-blue-400" />
                  وب‌سایت (اختیاری)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-red-500" />
                آدرس حضوری
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                placeholder="آدرس دقیق دفتر یا فروشگاه"
              />
            </div>

            {/* Representation Type */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isOnline: !formData.isOnline })}
                className={cn(
                  "flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all",
                  formData.isOnline ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-400"
                )}
              >
                <Monitor size={20} />
                <span className="font-bold text-sm">نمایندگی آنلاین</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPhysical: !formData.isPhysical })}
                className={cn(
                  "flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all",
                  formData.isPhysical ? "border-green-500 bg-green-50 text-green-700" : "border-gray-100 bg-gray-50 text-gray-400"
                )}
              >
                <Store size={20} />
                <span className="font-bold text-sm">نمایندگی حضوری</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : success ? <Check /> : null}
              {success ? 'تغییرات ذخیره شد' : 'ثبت و بروزرسانی پروفایل تجاری'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">محصولات شما</h2>
                <p className="text-sm text-gray-500">لیست کالاهای موجود در فروشگاه شما</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-all"
            >
              <Plus size={18} />
              افزودن محصول جدید
            </button>
          </div>

          {productsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {product.category}
                      </span>
                      <span className="text-xs font-black text-gray-900">
                        {product.price} افغانی
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-bold">هنوز محصولی ثبت نکرده‌اید.</p>
              <button 
                onClick={() => setIsAddProductModalOpen(true)}
                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
              >
                اولین محصول خود را اضافه کنید
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">افزودن محصول جدید</h2>
                <button onClick={() => setIsAddProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">نام محصول</label>
                  <input
                    required
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                    placeholder="مثلا: پیراهن دست‌دوز هراتی"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">قیمت (افغانی)</label>
                    <input
                      required
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">دسته‌بندی</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="سایر">عمومی</option>
                      <option value="پوشاک">پوشاک</option>
                      <option value="صنایع دستی">هنری</option>
                      <option value="خوراک">خوراکی</option>
                      <option value="الکترونیک">تکنولوژی</option>
                      <option value="ساخت و ساز">ساخت و ساز</option>
                      <option value="عکاسی">عکاسی</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">تعداد موجودی</label>
                    <input
                      required
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                      placeholder="مثلا: 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">سایزها (با کاما جدا کنید)</label>
                    <input
                      type="text"
                      value={newProduct.sizes}
                      onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                      placeholder="S, M, L, XL"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">لینک تصویر محصول</label>
                  <input
                    required
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">توضیحات</label>
                  <textarea
                    required
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                    placeholder="جزئیات محصول را اینجا بنویسید..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                  انتشار محصول در فروشگاه
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessRegistration;
