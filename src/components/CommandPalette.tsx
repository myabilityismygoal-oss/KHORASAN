import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  BookOpen, 
  Users, 
  Wallet, 
  Settings, 
  MessageCircle, 
  HelpCircle,
  X,
  Command as CommandIcon
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    { id: 'shop', title: 'فروشگاه', description: 'مشاهده محصولات و خرید', icon: <ShoppingBag size={18} />, action: () => navigate('/shop'), category: 'ناوبری' },
    { id: 'edu', title: 'آموزش', description: 'کورس‌ها و معماها', icon: <BookOpen size={18} />, action: () => navigate('/education'), category: 'ناوبری' },
    { id: 'lib', title: 'کتابخانه', description: 'کتاب‌ها و مقالات', icon: <BookOpen size={18} />, action: () => navigate('/library'), category: 'ناوبری' },
    { id: 'social', title: 'شبکه اجتماعی', description: 'ارتباط با دوستان', icon: <Users size={18} />, action: () => navigate('/social'), category: 'ناوبری' },
    { id: 'wallet', title: 'کیف پول', description: 'مدیریت توکن‌های عشقری', icon: <Wallet size={18} />, action: () => navigate('/wallet'), category: 'حساب' },
    { id: 'settings', title: 'تنظیمات', description: 'مدیریت حساب و اعلان‌ها', icon: <Settings size={18} />, action: () => navigate('/settings'), category: 'حساب' },
    { id: 'messages', title: 'پیام‌ها', description: 'گفتگو با دیگران', icon: <MessageCircle size={18} />, action: () => navigate('/messages/list'), category: 'ارتباطات' },
    { id: 'help', title: 'راهنما', description: 'سوالات متداول و پشتیبانی', icon: <HelpCircle size={18} />, action: () => {}, category: 'سایر' },
  ];

  const filteredCommands = query === '' 
    ? commands 
    : commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) || 
        cmd.description.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Floating Trigger for Mobile/Quick Access */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all md:hidden"
      >
        <CommandIcon size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:pt-32">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
            >
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <Search className="text-gray-400" size={20} />
                <input
                  autoFocus
                  type="text"
                  placeholder="جستجوی فرمان یا بخش..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-lg"
                />
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length > 0 ? (
                  <div className="space-y-4">
                    {Array.from(new Set(filteredCommands.map(c => c.category))).map(category => (
                      <div key={category}>
                        <h3 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {category}
                        </h3>
                        <div className="space-y-1">
                          {filteredCommands.filter(c => c.category === category).map(cmd => (
                            <button
                              key={cmd.id}
                              onClick={() => handleAction(cmd.action)}
                              className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-blue-50 group transition-all text-right"
                            >
                              <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white text-gray-500 group-hover:text-blue-600 transition-colors">
                                {cmd.icon}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{cmd.title}</p>
                                <p className="text-xs text-gray-500">{cmd.description}</p>
                              </div>
                              <div className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500">
                                ENTER
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Search size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500">نتیجه‌ای یافت نشد.</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="bg-white border border-gray-200 px-1 rounded shadow-sm">ESC</kbd> برای بستن
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-white border border-gray-200 px-1 rounded shadow-sm">↑↓</kbd> برای جابجایی
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CommandIcon size={12} />
                  <span>بخش فرمان خراسان</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandPalette;
