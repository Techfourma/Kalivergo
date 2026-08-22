'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutGrid, 
  ClipboardList, 
  User,
  Wallet, 
  Calendar, 
  GraduationCap,
  Home,
  X,
  Menu
} from 'lucide-react';

export default function CMSNavbar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('cmsSidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('cmsSidebarCollapsed', JSON.stringify(newState));
  };

  const menuItems = [
    {
      label: 'Home',
      href: '/home',
      icon: Home,
    },
    {
      label: 'Overview',
      href: '/cms',
      icon: LayoutGrid,
    },
    {
      label: 'Manage Tasks',
      href: '/cms/tasks',
      icon: ClipboardList,
    },
    {
      label: 'People Management',
      href: '/cms/people',
      icon: User,
    },
    {
      label: 'Finance',
      href: '/cms/finance',
      icon: Wallet,
    },
    {
      label: 'Schedule',
      href: '/cms/schedule',
      icon: Calendar,
    },
    {
      label: 'Seminar',
      href: '/cms/seminar',
      icon: GraduationCap,
    },
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {}
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Open Menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {}
      <aside 
        className={`bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 -translate-x-full' : 'w-64'
        }`}
      >
        <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              CMS MENU
            </h2>
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close Menu"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <nav className="space-y-1 px-3 pb-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}