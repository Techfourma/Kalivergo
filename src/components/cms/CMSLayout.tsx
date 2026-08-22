'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ClipboardList, 
  User,
  Wallet, 
  Calendar, 
  GraduationCap,
  Home,
} from 'lucide-react';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export default function CMSLayout({ children }: CMSLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Home',
      href: '/home',
      icon: Home,
    },

    {
      label: 'Overview',
      href: '/cms',
      icon: LayoutDashboard,
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

  return (
    <div className="flex min-h-screen bg-dark-50">
      {}
      <aside className="w-64 bg-white border-r border-dark-200">
        <div className="p-6">
          <h2 className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
            CMS Menu
          </h2>
        </div>
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-dark-700 hover:bg-dark-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}