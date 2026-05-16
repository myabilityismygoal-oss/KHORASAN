import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowLeft, ArrowRight, ShieldCheck, Stars, Globe } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'کاربر جدید',
          photoURL: user.photoURL || '',
          tokenBalance: 100,
          role: 'user',
          createdAt: new Date().toISOString(),
          preferences: {
            notifications: {
              newFeatures: { inApp: true, push: true },
              transactions: { inApp: true, push: true },
              messages: { inApp: true, push: true },
              offers: { inApp: true, push: true },
              alerts: { inApp: true, push: true },
              priceChanges: { inApp: true, push: true },
              stockUpdates: { inApp: true, push: true },
            }
          }
        };
        await setDoc(userRef, newProfile);
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError('خطا در ورود با گوگل. لطفا دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName });
        
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: displayName,
          tokenBalance: 100, // Initial Eshghari tokens
          role: 'user',
          createdAt: new Date().toISOString(),
          preferences: {
            notifications: {
              newFeatures: { inApp: true, push: true },
              transactions: { inApp: true, push: true },
              messages: { inApp: true, push: true },
              offers: { inApp: true, push: true },
              alerts: { inApp: true, push: true },
              priceChanges: { inApp: true, push: true },
              stockUpdates: { inApp: true, push: true },
            }
          }
        };
        
        await setDoc(doc(db, 'users', user.uid), newProfile);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found') setError('کاربری با این مشخصات یافت نشد.');
      else if (err.code === 'auth/wrong-password') setError('رمز عبور اشتباه است.');
      else if (err.code === 'auth/email-already-in-use') setError('این ایمیل قبلاً ثبت‌نام شده است.');
      else if (err.code === 'auth/weak-password') setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      else setError('مشکلی در برقراری ارتباط رخ داده است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl shadow-blue-500/5">
      {/* Left Pane - Visual/Marketing */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px] -ml-48 -mt-48" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-[120px] -mr-48 -mb-48" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
              <Stars size={20} className="text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter italic font-serif">Khorasan</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 max-w-md"
          >
            <h2 className="text-5xl font-black leading-tight">
              دروازه‌ای به فرهنگ و تمدن خراسان بزرگ
            </h2>
            <p className="text-lg text-blue-100 font-medium leading-relaxed opacity-80">
              به جامع‌ترین پلتفرم فرهنگی، اجتماعی و اقتصادی منطقه بپیوندید و با تمدنی ماندگار همراه شوید.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">امنیت بالا</span>
            </div>
            <p className="text-sm opacity-60">داده‌های شما با بالاترین استانداردهای امنیتی حفظ می‌شود.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-200">
              <Globe size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">ارتباط جهانی</span>
            </div>
            <p className="text-sm opacity-60">ارتباط بیواسطه با هم‌زبانان و هم‌فرهنگان در سراسر جهان.</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-right space-y-2">
            <h1 className="text-3xl font-black text-gray-900">
              {isLogin ? 'خوش آمدید' : 'ساخت حساب کاربری'}
            </h1>
            <p className="text-gray-500 font-medium">
              {isLogin ? 'مشخصات خود را برای ورود وارد کنید' : 'اطلاعات خود را برای عضویت تکمیل کنید'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">نام و نام خانوادگی</label>
                  <div className="relative group">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      placeholder="مثال: احمد علوی"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">آدرس ایمیل</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </motion.div>

            <motion.div layout className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">رمز عبور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
                  <ArrowLeft size={20} />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-widest text-gray-300">
                <span className="bg-white px-4">یا به روش‌های دیگر</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-xs font-black text-gray-600"
              >
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                  <span className="font-serif italic font-black">f</span>
                </div>
                فیس‌بوک
              </button>
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-xs font-black text-gray-600"
              >
                <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center text-red-600">
                  <span className="font-serif italic font-black">G</span>
                </div>
                گوگل
              </button>
            </div>
          </div>

          <p className="text-center text-sm font-bold text-gray-500 pt-4">
            {isLogin ? 'هنوز ثبت‌نام نکرده‌اید؟ ' : 'قبلاً حساب کاربری ساخته‌اید؟ '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? 'ایجاد حساب جدید' : 'وارد شوید'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
