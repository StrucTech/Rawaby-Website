'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Service {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  duration: string;
  price: number;
  category: string;
  active: boolean;
}

interface AboutSettings {
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionText: string;
  servicesTitle: string;
  servicesSubtitle: string;
  contactTitle: string;
  contactSubtitle: string;
}

interface FooterSettings {
  phone: string;
  email: string;
  address: string;
  socialLinks: {
    whatsapp: string;
  };
}

// أيقونات افتراضية للخدمات
const getServiceIcon = (index: number) => {
  const icons = [
    // أيقونة التقديم/التسجيل
    <svg key="1" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>,
    // أيقونة التوثيق
    <svg key="2" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>,
    // أيقونة الاستخراج
    <svg key="3" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>,
    // أيقونة الخدمات التعليمية
    <svg key="4" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>,
    // أيقونة الشهادات
    <svg key="5" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>,
    // أيقونة المتابعة
    <svg key="6" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>,
  ];
  return icons[index % icons.length];
};

export default function AboutPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutSettings, setAboutSettings] = useState<AboutSettings>({
    heroTitle: 'من نحن',
    heroSubtitle: 'نسعى لتقديم خدمات تعليمية متميزة للمصريين في المملكة العربية السعودية',
    missionTitle: 'رسالتنا',
    missionText: 'نحن نؤمن بأن التعليم هو أساس تقدم المجتمع. نسعى جاهدين لتقديم خدمات تعليمية متميزة تساعد الطلاب المصريين في المملكة العربية السعودية على تحقيق أهدافهم الأكاديمية وتطوير مهاراتهم. نقدم خدماتنا من خلال نخبة من المعلمين المتخصصين باستخدام أحدث الوسائل التعليمية.',
    servicesTitle: 'خدماتنا',
    servicesSubtitle: 'نقدم مجموعة متكاملة من الخدمات التعليمية المتميزة',
    contactTitle: 'تواصل معنا',
    contactSubtitle: 'نحن هنا لمساعدتك في تحقيق أهدافك التعليمية',
  });
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    phone: '+966 50 000 0000',
    email: 'info@example.com',
    address: 'الرياض، المملكة العربية السعودية',
    socialLinks: {
      whatsapp: 'https://wa.me/966500000000',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الخدمات والإعدادات معاً
        const [servicesRes, settingsRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/admin/site-settings')
        ]);
        
        const servicesData = await servicesRes.json();
        const settingsData = await settingsRes.json();
        
        if (servicesData.success && servicesData.services) {
          setServices(servicesData.services);
        }
        
        if (settingsData.success && settingsData.settings) {
          if (settingsData.settings.about) {
            setAboutSettings(prev => ({ ...prev, ...settingsData.settings.about }));
          }
          if (settingsData.settings.footer) {
            setFooterSettings(prev => ({ ...prev, ...settingsData.settings.footer }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {aboutSettings.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl">
              {aboutSettings.heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {aboutSettings.missionTitle}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            {aboutSettings.missionText}
          </p>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {aboutSettings.servicesTitle}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {aboutSettings.servicesSubtitle}
            </p>
          </div>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="mt-12 text-center text-gray-500">
              <p>لا توجد خدمات متاحة حالياً</p>
            </div>
          ) : (
            <div className={`mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 ${services.length >= 3 ? 'lg:grid-cols-3' : ''} ${services.length >= 4 ? 'xl:grid-cols-4' : ''}`}>
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                      {getServiceIcon(index)}
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {service.description}
                    </p>
                  </div>
                  <Link 
                    href="/services" 
                    className="absolute inset-0" 
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              عرض جميع الخدمات
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {aboutSettings.contactTitle}
              </h2>
              <div className="mt-3">
                <p className="text-lg text-gray-500">
                  {aboutSettings.contactSubtitle}
                </p>
              </div>
              <div className="mt-9">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="mr-3 text-base text-gray-500">
                    <p>{footerSettings.phone}</p>
                    <p className="mt-1">{footerSettings.address}</p>
                  </div>
                </div>
                <div className="mt-6 flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mr-3 text-base text-gray-500">
                    <p>{footerSettings.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 sm:mt-16 md:mt-0">
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                تواصل عبر واتساب
              </h2>
              <div className="mt-9">
                <Link
                  href={footerSettings.socialLinks.whatsapp || 'https://wa.me/966500000000'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <svg className="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  تواصل معنا عبر واتساب
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 