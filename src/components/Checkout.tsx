import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, MapPin, Phone, CreditCard, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Checkout: React.FC = () => {
  const { cart, totalAmount, checkout, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      await checkout({
        address: formData.address,
        phone: formData.phone
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/shop');
      }, 3000);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('خطا در ثبت سفارش. لطفا دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900">سفارش با موفقیت ثبت شد!</h2>
        <p className="text-gray-500 font-medium leading-loose px-4">
          سفارش شما دریافت شد و به زودی توسط فروشنده بررسی خواهد شد. می‌توانید وضعیت سفارش خود را در بخش تراکنش‌ها دنبال کنید.
        </p>
        <button 
          onClick={() => navigate('/shop')}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2"
        >
          <ShoppingBag size={20} />
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900">سبد خرید شما خالی است</h2>
        <button 
          onClick={() => navigate('/shop')}
          className="text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline"
        >
          <ArrowRight size={18} />
          مشاهده محصولات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900">نهایی‌سازی خرید</h1>
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-500 font-bold flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={20} />
          بازگشت
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <MapPin className="text-blue-600" size={24} />
                اطلاعات ارسال
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">آدرس دقیق</label>
                  <textarea 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white p-4 rounded-2xl transition-all outline-none min-h-[120px] font-medium"
                    placeholder="استان، شهر، خیابان، کوچه، پلاک..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">شماره تماس</label>
                  <div className="relative group">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white p-4 pr-12 rounded-2xl transition-all outline-none font-bold"
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">یادداشت برای فروشنده (اختیاری)</label>
                  <input 
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white p-4 rounded-2xl transition-all outline-none font-medium"
                    placeholder="مثلا: در ساعات عصر تحویل داده شود"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
               <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                <CreditCard className="text-blue-600" size={24} />
                روش پرداخت
              </h2>
              <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="font-black text-blue-900 text-sm">پرداخت هنگام تحویل (COD)</h3>
                  <p className="text-[10px] text-blue-700 font-bold">هزینه محصول را درب منزل پرداخت کنید</p>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  ثبت نهایی سفارش
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <h2 className="text-xl font-black">خلاصه سفارش</h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 flex items-center gap-2">
                      <span>{item.quantity} عدد</span>
                      {item.selectedSize && <span>• سایز: {item.selectedSize}</span>}
                    </p>
                    <p className="text-xs font-black text-blue-400 mt-1">{item.price * item.quantity} افغانی</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">مجموع اقلام</span>
                <span className="font-black">{totalAmount} افغانی</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">هزینه ارسال</span>
                <span className="text-green-400 font-black">رایگان</span>
              </div>
              <div className="flex justify-between text-xl pt-3">
                <span className="font-black">مبلغ قابل پرداخت</span>
                <span className="font-black text-blue-400">{totalAmount} افغانی</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900">ضمانت خرید خراسان</h4>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed">پرداخت امن و تضمین بازگشت وجه در صورت نارضایتی</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
