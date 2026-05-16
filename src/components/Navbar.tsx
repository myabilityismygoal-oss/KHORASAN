import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { Heart, MessageCircle, PlusSquare, Search as SearchIcon, LogOut, Palette, Package, LayoutGrid, Book, ShoppingCart, User as UserIcon } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useCart } from '../contexts/CartContext';

interface NavbarProps {
  user: User | null;
  profile: UserProfile | null;
}

const Navbar: React.FC<NavbarProps> = ({ user, profile }) => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-white/60 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
            <Book size={18} fill="currentColor" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tighter italic font-serif">
            Khorasan
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/search')}
            className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all md:hidden"
          >
            <SearchIcon size={24} />
          </button>

          <button 
            onClick={() => navigate('/shop')}
            className="relative p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
            title="فروشگاه"
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => navigate('/social')}
            className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
          >
            <PlusSquare size={24} />
          </button>

          <button 
            onClick={() => navigate('/art')}
            className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
            title="هنر"
          >
            <Palette size={24} />
          </button>

          <button 
            onClick={() => navigate('/apks')}
            className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
            title="مدیریت APK"
          >
            <Package size={24} />
          </button>

          <button 
            onClick={() => navigate('/explore')}
            className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
            title="خدمات"
          >
            <LayoutGrid size={24} />
          </button>

          {user ? (
            <button 
              onClick={() => navigate('/profile')}
              className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
              title="پروفایل"
            >
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <UserIcon size={24} />
              )}
            </button>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <UserIcon size={16} />
              <span>ورود / عضویت</span>
            </button>
          )}

          <NotificationCenter user={user} profile={profile} />

          <button 
            onClick={() => navigate('/messages')}
            className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
          >
            <MessageCircle size={24} />
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
              title="خروج"
            >
              <LogOut size={22} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
