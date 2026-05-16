import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile, Course } from '../types';
import { GraduationCap, BookOpen, Award, CheckCircle, Loader2, Edit3, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  user: User;
  profile: UserProfile | null;
  courses: Course[];
}

const EducationProfile: React.FC<Props> = ({ user, profile, courses }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState(profile?.educationProfile?.bio || '');
  const [interests, setInterests] = useState(profile?.educationProfile?.interests || []);
  const [newInterest, setNewInterest] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'educationProfile.bio': bio,
        'educationProfile.interests': interests
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating education profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const enrolledCourses = courses.filter(c => profile?.educationProfile?.enrolledCourses?.includes(c.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/30">
            <img 
              src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} 
              alt={user.displayName || 'User'} 
              className="w-full h-full rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 text-center md:text-right space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-3xl font-bold">{user.displayName || 'دانشجو'}</h2>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">پروفایل آموزشی</span>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm outline-none focus:bg-white/20 transition-all placeholder:text-white/50"
                  placeholder="درباره اهداف آموزشی خود بنویسید..."
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-white text-indigo-700 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    ذخیره تغییرات
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 bg-white/10 text-white py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-indigo-100 text-sm leading-relaxed max-w-xl">
                  {bio || 'هنوز بیوگرافی آموزشی ثبت نشده است. برای ویرایش روی دکمه زیر کلیک کنید.'}
                </p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                >
                  <Edit3 size={14} />
                  ویرایش بیوگرافی
                </button>
              </div>
            )}
          </div>
        </div>
        <GraduationCap size={200} className="absolute -bottom-10 -right-10 text-white/10" />
      </div>

      {/* Stats & Interests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Enrolled Courses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BookOpen size={20} />
                </div>
                <h3 className="font-bold text-gray-900">دوره‌های من</h3>
              </div>
              <span className="text-xs font-bold text-gray-400">{enrolledCourses.length} دوره در حال یادگیری</span>
            </div>

            {enrolledCourses.length > 0 ? (
              <div className="space-y-4">
                {enrolledCourses.map(course => (
                  <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                      {course.title[0]}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-all">{course.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-1/3 rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">۳۳٪ تکمیل شده</span>
                      </div>
                    </div>
                    <CheckCircle size={18} className="text-gray-300 group-hover:text-green-500 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <BookOpen size={32} />
                </div>
                <p className="text-sm text-gray-400">هنوز در دوره‌ای ثبت‌نام نکرده‌اید.</p>
                <button className="text-blue-600 text-xs font-bold hover:underline">مشاهده دوره‌های آموزشی</button>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                <Award size={20} />
              </div>
              <h3 className="font-bold text-gray-900">دستاوردها و مدارک</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-xl flex flex-col items-center text-center gap-2 opacity-40 grayscale">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                    <Award size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">قفل شده</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Interests */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">علاقه‌مندی‌های آموزشی</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map(interest => (
                <span 
                  key={interest} 
                  className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold flex items-center gap-1 group"
                >
                  {interest}
                  {isEditing && (
                    <button onClick={() => removeInterest(interest)} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                  placeholder="افزودن..."
                />
                <button 
                  onClick={addInterest}
                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h4 className="font-bold text-indigo-900 text-sm mb-2">پیشنهاد ویژه</h4>
            <p className="text-indigo-700 text-xs leading-relaxed mb-4">
              با تکمیل اولین دوره آموزشی خود، ۱۰۰ توکن عشقری هدیه بگیرید!
            </p>
            <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
              شروع یادگیری
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationProfile;

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
