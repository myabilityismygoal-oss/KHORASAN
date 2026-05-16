import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Check, Mail, MessageCircle, Twitter, Facebook, Gift, Users, Send } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  user: User;
}

const InviteFriends: React.FC<Props> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `https://khorasan.app/join?ref=${user.uid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { id: 'whatsapp', icon: <MessageCircle size={20} />, color: 'bg-green-500', label: 'واتساپ', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`به پلتفرم خراسان بپیوندید: ${inviteLink}`)}`) },
    { id: 'telegram', icon: <Send size={20} />, color: 'bg-blue-400', label: 'تلگرام', action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('به پلتفرم خراسان بپیوندید')}`) },
    { id: 'email', icon: <Mail size={20} />, color: 'bg-red-500', label: 'ایمیل', action: () => window.open(`mailto:?subject=دعوت به خراسان&body=به پلتفرم خراسان بپیوندید: ${inviteLink}`) },
    { id: 'twitter', icon: <Twitter size={20} />, color: 'bg-sky-400', label: 'توییتر', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`به پلتفرم خراسان بپیوندید: ${inviteLink}`)}`) },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 opacity-80 text-xs font-bold uppercase tracking-wider">
            <Gift size={16} />
            <span>پاداش دعوت</span>
          </div>
          <h3 className="text-2xl font-bold">دوستان خود را دعوت کنید</h3>
          <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
            با دعوت هر دوست به پلتفرم خراسان، ۵۰ توکن عشقری هدیه بگیرید!
          </p>
        </div>
        <Users size={120} className="absolute -bottom-4 -right-4 text-white/10" />
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">لینک اختصاصی شما</label>
          <div className="flex items-center gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-600 outline-none font-mono"
            />
            <button
              onClick={handleCopy}
              className={cn(
                "px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
                copied ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'کپی شد' : 'کپی لینک'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase">اشتراک‌گذاری سریع</label>
          <div className="grid grid-cols-4 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "p-3 rounded-2xl text-white shadow-sm transition-all group-hover:scale-110 group-active:scale-95",
                  option.color
                )}>
                  {option.icon}
                </div>
                <span className="text-[10px] font-bold text-gray-500">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>تعداد دعوت‌های موفق:</span>
            <span className="font-bold text-gray-900">۰ نفر</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteFriends;

// Helper function for class names
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
