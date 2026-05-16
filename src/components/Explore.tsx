import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, GraduationCap, Book, Palette, 
  BookOpen, HelpCircle, StickyNote, Landmark, 
  HelpCircle as RiddleIcon, Leaf, Users, MessageCircle,
  Package, Wallet, BrainCircuit, Globe, Clock
} from 'lucide-react';
import { motion } from 'motion/react';

const Explore: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    { id: 'shop', label: 'فروشگاه', icon: ShoppingBag, path: '/shop', color: 'bg-blue-500' },
    { id: 'education', label: 'آموزش', icon: GraduationCap, path: '/education', color: 'bg-green-500' },
    { id: 'library', label: 'کتابخانه', icon: Book, path: '/library', color: 'bg-amber-500' },
    { id: 'art', label: 'هنر و مفکوره', icon: Palette, path: '/art', color: 'bg-purple-500' },
    { id: 'wordbank', label: 'بانک لغات', icon: BookOpen, path: '/wordbank', color: 'bg-indigo-500' },
    { id: 'qa', label: 'سوال و جواب', icon: HelpCircle, path: '/qa', color: 'bg-rose-500' },
    { id: 'notes', label: 'یادداشت‌ها', icon: StickyNote, path: '/notes', color: 'bg-yellow-500' },
    { id: 'culture', label: 'فرهنگ و تمدن', icon: Landmark, path: '/culture', color: 'bg-emerald-500' },
    { id: 'environment', label: 'محیط زیست', icon: Leaf, path: '/culture?category=environment', color: 'bg-green-600' },
    { id: 'riddles', label: 'معما و چیستان', icon: RiddleIcon, path: '/riddles', color: 'bg-orange-500' },
    { id: 'apks', label: 'مدیریت APK', icon: Package, path: '/apks', color: 'bg-cyan-500' },
    { id: 'reminders', label: 'یادآورها', icon: Clock, path: '/reminders', color: 'bg-indigo-600' },
    { id: 'tokens', label: 'توکن عشقری', icon: Wallet, path: '/transactions', color: 'bg-pink-500' },
    { id: 'social', label: 'شبکه اجتماعی', icon: Users, path: '/social', color: 'bg-sky-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">کاوش در خراسان</h1>
        <p className="text-gray-500">تمام خدمات و امکانات پلتفرم در یک نگاه</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(service.path)}
              className="group relative bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center space-y-4 overflow-hidden"
            >
              <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={28} />
              </div>
              <span className="font-black text-gray-900 text-sm">{service.label}</span>
              
              {/* Decorative background element */}
              <div className={`absolute -bottom-4 -right-4 w-16 h-16 ${service.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform`} />
            </motion.button>
          );
        })}
      </div>

      {/* AI Assistant Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
            <BrainCircuit size={40} />
          </div>
          <div className="text-center md:text-right space-y-2">
            <h2 className="text-2xl font-black">دستیار هوشمند خراسان</h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              در بخش‌های آموزش، بانک لغات و سوال و جواب، هوش مصنوعی ما آماده کمک به شماست.
            </p>
          </div>
          <button 
            onClick={() => navigate('/qa')}
            className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all whitespace-nowrap"
          >
            شروع گفتگو
          </button>
        </div>
        
        {/* Animated background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </motion.div>
    </div>
  );
};

export default Explore;
