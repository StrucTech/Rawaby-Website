'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    nationalId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'ضعيفة جداً',
    color: 'bg-red-500',
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChar: false
    }
  });

  const [errors, setErrors] = useState({
    fullName: '',
    mobileNumber: '',
    nationalId: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  const [activationMsg, setActivationMsg] = useState<string | null>(null);

  // حساب قوة كلمة المرور
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    let score = 0;
    if (requirements.minLength) score++;
    if (requirements.hasUppercase) score++;
    if (requirements.hasLowercase) score++;
    if (requirements.hasNumbers) score++;
    if (requirements.hasSpecialChar) score++;

    let label = 'ضعيفة جداً';
    let color = 'bg-red-500';

    if (score === 0) {
      label = 'ضعيفة جداً';
      color = 'bg-red-600';
    } else if (score === 1) {
      label = 'ضعيفة';
      color = 'bg-red-500';
    } else if (score === 2) {
      label = 'متوسطة';
      color = 'bg-yellow-500';
    } else if (score === 3) {
      label = 'قوية';
      color = 'bg-blue-500';
    } else if (score >= 4) {
      label = 'قوية جداً';
      color = 'bg-green-500';
    }

    return {
      score,
      label,
      color,
      requirements
    };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      mobileNumber: '',
      nationalId: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: ''
    };

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الرجاء إدخال الاسم الكامل';
    }

    // Mobile Number validation
    const egyptPattern = /^(01)[0-9]{9}$/;
    if (!egyptPattern.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'الرجاء إدخال رقم جوال مصري صحيح (01XXXXXXXXX)';
    }

    // National ID validation
    const nationalIdRegex = /^[0-9]{14}$/;
    if (!nationalIdRegex.test(formData.nationalId)) {
      newErrors.nationalId = 'الرجاء إدخال رقم قومي مصري صحيح (14 رقم)';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'الرجاء إدخال بريد إلكتروني صحيح';
    }

    // Password strength validation
    if (passwordStrength.score < 4) {
      newErrors.password = 'كلمة المرور لا تستوفي المتطلبات الأمنية';
    }

    // Confirm Password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));

    if (validateForm()) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.fullName,
            phone: formData.mobileNumber,
            nationalId: formData.nationalId,
            email: formData.email,
            password: formData.password
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'حدث خطأ أثناء التسجيل');
        }

        setActivationMsg('تم إنشاء الحساب بنجاح. تم إرسال رابط التفعيل إلى بريدك الإلكتروني.');
        setFormData({
          fullName: '',
          mobileNumber: '',
          nationalId: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setPasswordStrength({
          score: 0,
          label: 'ضعيفة جداً',
          color: 'bg-red-500',
          requirements: {
            minLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumbers: false,
            hasSpecialChar: false
          }
        });
      } catch (error: any) {
        console.error('Registration error:', error);
        setErrors(prev => ({
          ...prev,
          general: error.message || 'حدث خطأ أثناء التسجيل'
        }));
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
          إنشاء حساب جديد
        </h2>
        <p className="mt-2 text-center text-sm text-black">
          أو{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            تسجيل الدخول
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {activationMsg && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 font-bold">{activationMsg}</p>
              </div>
            </div>
          )}
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-black">
                الاسم الكامل
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="الاسم الكامل"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-black">
                رقم الجوال
              </label>
              <div className="mt-1">
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>
                )}
              </div>
            </div>

            {/* National ID */}
            <div>
              <label htmlFor="nationalId" className="block text-sm font-medium text-black">
                الرقم القومي المصري
              </label>
              <div className="mt-1">
                <input
                  id="nationalId"
                  name="nationalId"
                  type="text"
                  required
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="14 رقم"
                  dir="ltr"
                />
                {errors.nationalId && (
                  <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black">
                البريد الإلكتروني
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="example@email.com"
                  dir="ltr"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Password Strength */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-black">
                  كلمة المرور
                </label>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  passwordStrength.score === 0 ? 'bg-gray-100 text-gray-600' :
                  passwordStrength.score === 1 ? 'bg-red-100 text-red-700' :
                  passwordStrength.score === 2 ? 'bg-yellow-100 text-yellow-700' :
                  passwordStrength.score === 3 ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="mt-2">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="12 حرف على الأقل"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.604-1.159a3.999 3.999 0 110 5.658M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Bar */}
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>

                {/* Requirements */}
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">متطلبات القوة:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <svg className={`h-4 w-4 ${passwordStrength.requirements.minLength ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={passwordStrength.requirements.minLength ? 'text-green-700 font-medium' : 'text-gray-600'}>
                        12 حرف على الأقل
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className={`h-4 w-4 ${passwordStrength.requirements.hasUppercase ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={passwordStrength.requirements.hasUppercase ? 'text-green-700 font-medium' : 'text-gray-600'}>
                        حرف كبير واحد (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className={`h-4 w-4 ${passwordStrength.requirements.hasLowercase ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={passwordStrength.requirements.hasLowercase ? 'text-green-700 font-medium' : 'text-gray-600'}>
                        حرف صغير واحد (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className={`h-4 w-4 ${passwordStrength.requirements.hasNumbers ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={passwordStrength.requirements.hasNumbers ? 'text-green-700 font-medium' : 'text-gray-600'}>
                        رقم واحد (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className={`h-4 w-4 ${passwordStrength.requirements.hasSpecialChar ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={passwordStrength.requirements.hasSpecialChar ? 'text-green-700 font-medium' : 'text-gray-600'}>
                        حرف خاص (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black">
                  تأكيد كلمة المرور
                </label>
                {formData.password && formData.confirmPassword && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    formData.password === formData.confirmPassword 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {formData.password === formData.confirmPassword ? '✓ متطابق' : '✗ غير متطابق'}
                  </span>
                )}
              </div>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="أعد إدخال كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.604-1.159a3.999 3.999 0 110 5.658M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || passwordStrength.score < 4}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || passwordStrength.score < 4
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? 'جاري التسجيل...' : 'إنشاء حساب'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 