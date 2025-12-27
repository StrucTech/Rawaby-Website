'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import NotificationBadge from './NotificationBadge';
import UserNotificationBadge from './UserNotificationBadge';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface NavigationItem {
  name: string;
  href: string;
  isLogout?: boolean;
}

const publicNavigation: NavigationItem[] = [
  { name: 'الرئيسية', href: '/' },
  { name: 'الخدمات', href: '/services' },
  { name: 'تسجيل الدخول', href: '/login' },
  { name: 'إنشاء حساب', href: '/register' },
  { name: 'من نحن', href: '/about' },
];

const privateNavigation: NavigationItem[] = [
  { name: 'الرئيسية', href: '/' },
  { name: 'الخدمات', href: '/services' },
  { name: 'سلة المشتريات', href: '/cart' },
  { name: 'طلباتي', href: '/my-orders' },
  { name: 'رسائلي', href: '/messages' },
  { name: 'من نحن', href: '/about' },
  { name: 'تسجيل الخروج', href: '#', isLogout: true },
];

const delegateNavigation: NavigationItem[] = [
  { name: 'الرئيسية', href: '/' },
  { name: 'مهام المندوب', href: '/delegate-tasks' },
  { name: 'رسائل المشرف', href: '/delegate/messages' },
  { name: 'من نحن', href: '/about' },
  { name: 'تسجيل الخروج', href: '#', isLogout: true },
];

const supervisorNavigation: NavigationItem[] = [
  { name: 'الرئيسية', href: '/' },
  { name: 'لوحة المشرف', href: '/supervisor/dashboard' },
  { name: 'رسائل المندوبين', href: '/supervisor/messages' },
  { name: 'من نحن', href: '/about' },
  { name: 'تسجيل الخروج', href: '#', isLogout: true },
];

const adminNavigation: NavigationItem[] = [
  { name: 'لوحة الإدارة', href: '/admin' },
  { name: 'إدارة الخدمات', href: '/admin/services' },
  { name: 'إدارة المشرفين', href: '/admin/supervisors' },
  { name: 'إدارة المندوبين', href: '/admin/delegates' },
  { name: 'إدارة المهام', href: '/admin/tasks' },
  { name: 'تسجيل الخروج', href: '#', isLogout: true },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const decoded = jwt_decode<DecodedToken>(token);
          if (decoded.name) {
            setUserName(decoded.name);
            setUserRole(decoded.role);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid token format');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          Cookies.remove('token');
          setUserName(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      } else {
        setUserName(null);
        setUserRole(null);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove('token');
    setUserName(null);
    setUserRole(null);
    setIsAuthenticated(false);
    router.push('/');
    router.refresh();
  };

  const getNavigation = () => {
    if (!isAuthenticated) return publicNavigation;
    if (userRole === 'admin') return adminNavigation;
    if (userRole === 'delegate') return delegateNavigation;
    if (userRole === 'supervisor') return supervisorNavigation;
    return privateNavigation;
  };

  const navigation = getNavigation();

  return (
    <nav className="bg-white shadow-lg">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                خدمات تعليمية
              </Link>
            </div>
            <div className="hidden sm:mr-6 sm:flex sm:space-x-8 sm:space-x-reverse">
              {navigation.map((item) => (
                item.isLogout ? (
                  <button
                    key={item.name}
                    onClick={handleLogout}
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* User Name Display and Supervisor Menu */}
          <div className="hidden sm:flex items-center space-x-4 space-x-reverse">
            {isAuthenticated && userName && (
              <div className="flex items-center space-x-4 space-x-reverse">
                {userRole === 'delegate' && <NotificationBadge />}
                {userRole === 'user' && <UserNotificationBadge />}
                <span className="text-blue-700 font-semibold">مرحباً، {userName}</span>
                {userRole === 'supervisor' && (
                  <div className="relative group">
                    <button className="text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-md hover:bg-blue-50">
                      لوحة المشرف ↓
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg invisible group-hover:visible">
                      <Link
                        href="/supervisor/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        عرض جميع الطلبات
                      </Link>
                      <Link
                        href="/supervisor/messages"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        رسائل المندوبين
                      </Link>
                      <Link
                        href="/supervisor/customer-messages"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        رسائل العملاء
                      </Link>
                      <Link
                        href="/supervisor/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        توزيع المهام
                      </Link>
                    </div>
                  </div>
                )}
                {userRole === 'admin' && (
                  <div className="relative group">
                    <button className="text-red-600 hover:text-red-800 font-medium px-3 py-2 rounded-md hover:bg-red-50">
                      لوحة الإدارة ↓
                    </button>
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg invisible group-hover:visible z-50">
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        لوحة التحكم الرئيسية
                      </Link>
                      <Link
                        href="/admin/services"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        إدارة الخدمات
                      </Link>
                      <Link
                        href="/admin/supervisors"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        إدارة المشرفين
                      </Link>
                      <Link
                        href="/admin/delegates"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        إدارة المندوبين
                      </Link>
                      <Link
                        href="/admin/tasks"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        متابعة المهام
                      </Link>
                    </div>
                  </div>
                )}
                {userRole === 'delegate' && (
                  <div className="relative group">
                    <button className="text-green-600 hover:text-green-800 font-medium px-3 py-2 rounded-md hover:bg-green-50">
                      لوحة المندوب ↓
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg invisible group-hover:visible">
                      <Link
                        href="/delegate-tasks"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        مهامي
                      </Link>
                      <Link
                        href="/delegate/messages"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        الرسائل
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">فتح القائمة</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {isAuthenticated && userName && (
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-blue-700 font-semibold">مرحباً، {userName}</p>
              {userRole && (
                <p className="text-sm text-gray-600">
                  {userRole === 'admin' ? 'مدير' : 
                   userRole === 'supervisor' ? 'مشرف' : 
                   userRole === 'delegate' ? 'مندوب' : 'مستخدم'}
                </p>
              )}
            </div>
          )}
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block pr-3 pl-3 py-2 border-r-4 text-base font-medium ${
                pathname === item.href
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-right pr-3 pl-3 py-2 border-r-4 text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              تسجيل الخروج
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 