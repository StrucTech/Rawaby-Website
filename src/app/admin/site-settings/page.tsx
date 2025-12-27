'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

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

interface QuickLink {
  text: string;
  href: string;
}

interface FooterSettings {
  contactTitle: string;
  phone: string;
  email: string;
  address: string;
  quickLinksTitle: string;
  quickLinks: QuickLink[];
  socialTitle: string;
  socialLinks: {
    whatsapp: string;
    twitter: string;
    facebook: string;
    instagram: string;
  };
  copyright: string;
}

interface SiteSettings {
  about: AboutSettings;
  footer: FooterSettings;
}

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'footer'>('about');
  
  const [settings, setSettings] = useState<SiteSettings>({
    about: {
      heroTitle: 'من نحن',
      heroSubtitle: '',
      missionTitle: 'رسالتنا',
      missionText: '',
      servicesTitle: 'خدماتنا',
      servicesSubtitle: '',
      contactTitle: 'تواصل معنا',
      contactSubtitle: '',
    },
    footer: {
      contactTitle: 'تواصل معنا',
      phone: '',
      email: '',
      address: '',
      quickLinksTitle: 'روابط سريعة',
      quickLinks: [],
      socialTitle: 'تابعنا',
      socialLinks: {
        whatsapp: '',
        twitter: '',
        facebook: '',
        instagram: '',
      },
      copyright: '',
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/site-settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = Cookies.get('token');
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  const updateAbout = (field: keyof AboutSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      about: { ...prev.about, [field]: value }
    }));
  };

  const updateFooter = (field: keyof FooterSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      footer: { ...prev.footer, [field]: value }
    }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        socialLinks: { ...prev.footer.socialLinks, [platform]: value }
      }
    }));
  };

  const addQuickLink = () => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        quickLinks: [...prev.footer.quickLinks, { text: '', href: '' }]
      }
    }));
  };

  const updateQuickLink = (index: number, field: 'text' | 'href', value: string) => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        quickLinks: prev.footer.quickLinks.map((link, i) => 
          i === index ? { ...link, [field]: value } : link
        )
      }
    }));
  };

  const removeQuickLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        quickLinks: prev.footer.quickLinks.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-900">إعدادات الموقع</h1>

        {/* رسالة النتيجة */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* التبويبات */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'about'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📄 صفحة من نحن
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'footer'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔻 الـ Footer
          </button>
        </div>

        {/* محتوى صفحة من نحن */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">إعدادات صفحة "من نحن"</h2>
            
            {/* Hero Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-purple-700">🎯 القسم الرئيسي (Hero)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الرئيسي</label>
                <input
                  type="text"
                  value={settings.about.heroTitle}
                  onChange={(e) => updateAbout('heroTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الفرعي</label>
                <textarea
                  value={settings.about.heroSubtitle}
                  onChange={(e) => updateAbout('heroSubtitle', e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Mission Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-purple-700">📋 قسم الرسالة</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الرسالة</label>
                <input
                  type="text"
                  value={settings.about.missionTitle}
                  onChange={(e) => updateAbout('missionTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص الرسالة</label>
                <textarea
                  value={settings.about.missionText}
                  onChange={(e) => updateAbout('missionText', e.target.value)}
                  rows={5}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-purple-700">⚙️ قسم الخدمات</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الخدمات</label>
                <input
                  type="text"
                  value={settings.about.servicesTitle}
                  onChange={(e) => updateAbout('servicesTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الفرعي للخدمات</label>
                <input
                  type="text"
                  value={settings.about.servicesSubtitle}
                  onChange={(e) => updateAbout('servicesSubtitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-purple-700">📞 قسم التواصل</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان التواصل</label>
                <input
                  type="text"
                  value={settings.about.contactTitle}
                  onChange={(e) => updateAbout('contactTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الفرعي للتواصل</label>
                <input
                  type="text"
                  value={settings.about.contactSubtitle}
                  onChange={(e) => updateAbout('contactSubtitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* محتوى الـ Footer */}
        {activeTab === 'footer' && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">إعدادات الـ Footer</h2>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-purple-700">📞 معلومات التواصل</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان القسم</label>
                <input
                  type="text"
                  value={settings.footer.contactTitle}
                  onChange={(e) => updateFooter('contactTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={settings.footer.phone}
                    onChange={(e) => updateFooter('phone', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="+966 50 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={settings.footer.email}
                    onChange={(e) => updateFooter('email', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  value={settings.footer.address}
                  onChange={(e) => updateFooter('address', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="الرياض، المملكة العربية السعودية"
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-purple-700">🔗 الروابط السريعة</h3>
                <button
                  onClick={addQuickLink}
                  className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200"
                >
                  + إضافة رابط
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان القسم</label>
                <input
                  type="text"
                  value={settings.footer.quickLinksTitle}
                  onChange={(e) => updateFooter('quickLinksTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-3">
                {settings.footer.quickLinks.map((link, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={link.text}
                      onChange={(e) => updateQuickLink(index, 'text', e.target.value)}
                      placeholder="نص الرابط"
                      className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => updateQuickLink(index, 'href', e.target.value)}
                      placeholder="/path أو https://..."
                      className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => removeQuickLink(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-purple-700">🌐 روابط التواصل الاجتماعي</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان القسم</label>
                <input
                  type="text"
                  value={settings.footer.socialTitle}
                  onChange={(e) => updateFooter('socialTitle', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">واتساب</label>
                  <input
                    type="text"
                    value={settings.footer.socialLinks.whatsapp}
                    onChange={(e) => updateSocialLink('whatsapp', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="https://wa.me/966..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تويتر (X)</label>
                  <input
                    type="text"
                    value={settings.footer.socialLinks.twitter}
                    onChange={(e) => updateSocialLink('twitter', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">فيسبوك</label>
                  <input
                    type="text"
                    value={settings.footer.socialLinks.facebook}
                    onChange={(e) => updateSocialLink('facebook', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">انستغرام</label>
                  <input
                    type="text"
                    value={settings.footer.socialLinks.instagram}
                    onChange={(e) => updateSocialLink('instagram', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-purple-700">©️ حقوق النشر</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص حقوق النشر</label>
                <input
                  type="text"
                  value={settings.footer.copyright}
                  onChange={(e) => updateFooter('copyright', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="خدمات تعليمية. جميع الحقوق محفوظة."
                />
              </div>
            </div>
          </div>
        )}

        {/* زر الحفظ */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-3 px-6 rounded-lg text-white font-medium transition ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
          <a
            href="/admin"
            className="py-3 px-6 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition text-center"
          >
            العودة
          </a>
        </div>
      </div>
    </div>
  );
}
