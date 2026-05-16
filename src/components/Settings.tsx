import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { Bell, Shield, User as UserIcon, Loader2, Save, Sparkles, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { sendNotification } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: User;
  profile: UserProfile | null;
}

const Settings: React.FC<Props> = ({ user, profile }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  const defaultNotifications = {
    newFeatures: { inApp: true, push: true },
    transactions: { inApp: true, push: true },
    messages: { inApp: true, push: true },
    offers: { inApp: true, push: true },
    alerts: { inApp: true, push: true },
    priceChanges: { inApp: true, push: true },
    stockUpdates: { inApp: true, push: true },
  };

  const [preferences, setPreferences] = useState(profile?.preferences || {
    notifications: defaultNotifications
  });

  const notificationPrefs = preferences.notifications || defaultNotifications;

  const togglePreference = (category: keyof typeof defaultNotifications, type: 'inApp' | 'push') => {
    setPreferences({
      ...preferences,
      notifications: {
        ...notificationPrefs,
        [category]: {
          ...notificationPrefs[category],
          [type]: !notificationPrefs[category][type]
        }
      }
    });
  };

  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setBrowserNotificationStatus(permission);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        preferences
      });
      setSuccess('تنظیمات با موفقیت ذخیره شد.');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">تنظیمات حساب کاربری</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
            <UserIcon size={18} className="text-blue-600" />
            اطلاعات پروفایل
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">نام نمایشی</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                placeholder="نام خود را وارد کنید"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">بیوگرافی</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] text-sm"
                placeholder="چیزی درباره خودتان بنویسید..."
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              تنظیمات پیشرفته اعلان‌ها
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              کنترل‌های دقیق
            </span>
          </div>

          <div className="p-0">
            <div className="grid grid-cols-12 gap-0 border-b border-gray-100 bg-gray-50/30">
              <div className="col-span-6 p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">دسته‌بندی</div>
              <div className="col-span-3 p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">درون‌برنامه</div>
              <div className="col-span-3 p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">اعلان فشاری</div>
            </div>

            {[
              { id: 'newFeatures', label: 'ویژگی‌های جدید', desc: 'آپدیت‌های سیستمی و ابزارهای جدید', icon: Sparkles },
              { id: 'transactions', label: 'تراکنش‌ها', desc: 'ارسال و دریافت توکن و وضعیت خریدها', icon: Shield },
              { id: 'messages', label: 'پیام‌ها', desc: 'چت‌های مستقیم و پیام‌های کسب‌وکارها', icon: UserIcon },
              { id: 'offers', label: 'پیشنهادات ویژه', desc: 'تخفیف‌های اختصاصی و جشنواره‌ها', icon: Sparkles },
              { id: 'priceChanges', label: 'تغییر قیمت', desc: 'کاهش قیمت محصولات مورد علاقه', icon: Bell },
              { id: 'stockUpdates', label: 'موجودی کالا', desc: 'اطلاع از موجود شدن کالاهای در صف انتظار', icon: Bell },
              { id: 'alerts', label: 'هشدارهای مهم', desc: 'اعلانات امنیتی و پیام‌های حیاتی', icon: Shield },
            ].map((cat) => (
              <div key={cat.id} className="grid grid-cols-12 gap-0 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <div className="col-span-6 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <cat.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{cat.label}</p>
                    <p className="text-[10px] text-gray-500 font-medium leading-tight">{cat.desc}</p>
                  </div>
                </div>
                <div className="col-span-3 p-4 flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer scale-90">
                    <input
                      type="checkbox"
                      checked={notificationPrefs[cat.id as keyof typeof defaultNotifications].inApp}
                      onChange={() => togglePreference(cat.id as keyof typeof defaultNotifications, 'inApp')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="col-span-3 p-4 flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer scale-90">
                    <input
                      type="checkbox"
                      checked={notificationPrefs[cat.id as keyof typeof defaultNotifications].push}
                      onChange={() => togglePreference(cat.id as keyof typeof defaultNotifications, 'push')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gray-50/50">
            <div className="pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  disabled={browserNotificationStatus === 'granted'}
                  className={cn(
                    "flex-1 min-w-[200px] py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                    browserNotificationStatus === 'granted' 
                      ? "bg-green-50 text-green-600 cursor-default" 
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  )}
                >
                  <Bell size={18} />
                  {browserNotificationStatus === 'granted' 
                    ? 'اعلان‌های مرورگر فعال است' 
                    : 'فعال‌سازی اعلان‌های مرورگر'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await sendNotification(
                      user.uid,
                      'یادآور آزمایشی',
                      'این یک اعلان یادآور آزمایشی است. سیستم یادآوری شما به درستی کار می‌کند.',
                      'success',
                      'alert'
                    );
                  }}
                  className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
                  title="ارسال اعلان یادآور آزمایشی"
                >
                  <Bell size={18} />
                  تست یادآور
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await sendNotification(
                      user.uid,
                      'تست اعلان',
                      'این یک اعلان آزمایشی برای بررسی سیستم اطلاع‌رسانی است.',
                      'info',
                      'system'
                    );
                  }}
                  className="px-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2"
                  title="ارسال اعلان آزمایشی"
                >
                  <Sparkles size={18} />
                  تست سیستم
                </button>
              </div>
              {browserNotificationStatus === 'denied' && (
                <p className="text-[10px] text-red-500 mt-2 text-center">
                  شما دسترسی به اعلان‌ها را مسدود کرده‌اید. لطفاً از تنظیمات مرورگر خود آن را فعال کنید.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account Info (Static) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm opacity-60">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 border-b pb-2 text-gray-500">
            <Shield size={14} />
            اطلاعات سیستمی
          </h3>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">شناسه کاربری</label>
            <p className="text-xs font-mono text-gray-500 break-all">{user.uid}</p>
          </div>
          <div className="mt-4 space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">ایمیل ثبت شده</label>
            <p className="text-xs font-bold text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            ذخیره تنظیمات
          </button>
          <button
            type="button"
            onClick={async () => {
              await auth.signOut();
              navigate('/auth');
            }}
            className="flex-1 md:flex-none px-8 py-2 border border-red-200 text-red-500 rounded-lg font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            خروج از حساب
          </button>
          {success && <p className="text-green-500 text-sm font-medium">{success}</p>}
        </div>
      </form>
    </div>
  );
};

export default Settings;
