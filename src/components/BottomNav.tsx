import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, ShoppingBag, User, Palette, Package, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { icon: Home, path: '/', label: 'خانه' },
    { icon: Search, path: '/search', label: 'اکسپلور' },
    { icon: LayoutGrid, path: '/explore', label: 'خدمات' },
    { icon: PlusSquare, path: '/social', label: 'پست' },
    { icon: ShoppingBag, path: '/shop', label: 'فروشگاه' },
    { icon: User, path: '/profile', label: 'پروفایل' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-md border-t border-white/20 px-6 py-2 flex items-center justify-between z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = path === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 transition-all",
              isActive ? "text-gray-900" : "text-gray-400"
            )}
          >
            <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
