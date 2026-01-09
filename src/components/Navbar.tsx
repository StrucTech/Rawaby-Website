'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import NotificationBadge from './NotificationBadge';

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
  { name: 'التقييمات', href: '/reviews' },
  { name: 'تسجيل الدخول', href: '/login' },
  { name: 'إنشاء حساب', href: '/register' },
  { name: 'من نحن', href: '/about' },
];

const privateNavigation: NavigationItem[] = [
  { name: 'الرئيسية', href: '/' },
  { name: 'الخدمات', href: '/services' },
  { name: 'التقييمات', href: '/reviews' },
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
  const [ordersNotificationCount, setOrdersNotificationCount] = useState(0);
  const [messagesNotificationCount, setMessagesNotificationCount] = useState(0);
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

  // جلب عدد إشعارات الطلبات للعميل
  useEffect(() => {
    const fetchOrdersNotifications = async () => {
      if (userRole !== 'user') return;
      
      try {
        const token = Cookies.get('token');
        const response = await fetch('/api/delegate-completion?status=unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const clientNotifications = (data.notifications || []).filter(
            (n: any) => n.type === 'cancellation_approved' || n.type === 'cancellation_rejected'
          );
          setOrdersNotificationCount(clientNotifications.length);
        }
      } catch (error) {
        console.error('Error fetching orders notifications:', error);
      }
    };

    if (userRole === 'user') {
      fetchOrdersNotifications();
      const interval = setInterval(fetchOrdersNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  // جلب عدد الرسائل التي تحتاج رد للعميل
  useEffect(() => {
    const fetchMessagesCount = async () => {
      if (userRole !== 'user') return;
      
      try {
        const token = Cookies.get('token');
        const response = await fetch('/api/user/data-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const pendingCount = (data.requests || []).filter(
            (r: any) => r.status === 'pending'
          ).length;
          setMessagesNotificationCount(pendingCount);
        }
      } catch (error) {
        console.error('Error fetching messages count:', error);
      }
    };

    if (userRole === 'user') {
      fetchMessagesCount();
      const interval = setInterval(fetchMessagesCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

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
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium relative ${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                    {/* Badge للطلبات */}
                    {item.href === '/my-orders' && ordersNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                        {ordersNotificationCount}
                      </span>
                    )}
                    {/* Badge للرسائل */}
                    {item.href === '/messages' && messagesNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                        {messagesNotificationCount}
                      </span>
                    )}
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
                <span className="text-blue-700 font-semibold">مرحباً، {userName}</span>
                {userRole === 'supervisor' && (
                  <span className="text-blue-600 font-medium px-3 py-2 rounded-md"></span>
                )}
                {userRole === 'admin' && (
                  <span className="text-red-600 font-medium px-3 py-2 rounded-md"></span>
                )}
                {userRole === 'delegate' && (
                  <span className="text-green-600 font-medium px-3 py-2 rounded-md"></span>
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
            item.isLogout ? (
              <button
                key={item.name}
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-right pr-3 pl-3 py-2 border-r-4 text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {item.name}
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={`block pr-3 pl-3 py-2 border-r-4 text-base font-medium relative ${
                  pathname === item.href
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center justify-between">
                  {item.name}
                  {/* Badge للرسائل في الجوال */}
                  {item.href === '/messages' && messagesNotificationCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {messagesNotificationCount}
                    </span>
                  )}
                  {/* Badge للطلبات في الجوال */}
                  {item.href === '/my-orders' && ordersNotificationCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {ordersNotificationCount}
                    </span>
                  )}
                </span>
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
} 