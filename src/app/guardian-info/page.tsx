'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface GuardianInfo {
  fullName: string;
  mobileNumber: string;
  nationalId: string;
}

interface StudentInfo {
  fullName: string;
  grade: string;
  totalScore: string;
  certificateType: string;
}

interface OrderDetails {
  services: any[];
  totalPrice: number;
  timestamp: string;
}

export default function GuardianInfoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  const [guardianInfo, setGuardianInfo] = useState<GuardianInfo>({
    fullName: '',
    mobileNumber: '',
    nationalId: ''
  });

  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    fullName: '',
    grade: '',
    totalScore: '',
    certificateType: ''
  });

  // حفظ مؤقت للبيانات عند تغييرها
  useEffect(() => {
    localStorage.setItem('tempGuardianInfo', JSON.stringify(guardianInfo));
  }, [guardianInfo]);

  useEffect(() => {
    localStorage.setItem('tempStudentInfo', JSON.stringify(studentInfo));
  }, [studentInfo]);

  const [errors, setErrors] = useState({
    guardian: {
      fullName: '',
      mobileNumber: '',
      nationalId: ''
    },
    student: {
      fullName: '',
      grade: '',
      totalScore: '',
      certificateType: ''
    },
    general: ''
  });

  const [submitStatus, setSubmitStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login?redirectTo=/guardian-info');
      return;
    }

    try {
      jwtDecode(token);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login?redirectTo=/guardian-info');
      return;
    }

    // Clear any old contract-related data to ensure fresh flow
    localStorage.removeItem('completeOrderDetails');
    localStorage.removeItem('submittedGuardianData');
    
    // Load order details from localStorage
    const savedOrderDetails = localStorage.getItem('orderDetails');
    if (savedOrderDetails) {
      try {
        const parsedDetails = JSON.parse(savedOrderDetails);
        setOrderDetails(parsedDetails);
      } catch (error) {
        router.push('/services');
      }
    } else {
      router.push('/services');
    }

    // تحميل البيانات المحفوظة مسبقاً من قاعدة البيانات
    const loadSavedData = async () => {
      try {
        const response = await fetch('/api/guardian-student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // تحميل بيانات ولي الأمر إذا كانت موجودة
          if (data.guardian) {
            setGuardianInfo({
              fullName: data.guardian.full_name,
              mobileNumber: data.guardian.mobile_number,
              nationalId: data.guardian.national_id
            });
          } else {
            // تحميل البيانات المؤقتة من localStorage
            const tempGuardian = localStorage.getItem('tempGuardianInfo');
            if (tempGuardian) {
              try {
                const parsedGuardian = JSON.parse(tempGuardian);
                if (parsedGuardian.fullName) { // فقط إذا كانت البيانات غير فارغة
                  setGuardianInfo(parsedGuardian);
                  setSubmitStatus({
                    type: 'info',
                    message: 'تم استرجاع البيانات المحفوظة مؤقتاً'
                  });
                  // إخفاء الرسالة بعد 3 ثوان
                  setTimeout(() => {
                    setSubmitStatus(null);
                  }, 3000);
                }
              } catch (e) {}
            }
          }
          
          // تحميل بيانات آخر طالب إذا كان موجود
          if (data.students && data.students.length > 0) {
            const lastStudent = data.students[0]; // أحدث طالب
            setStudentInfo({
              fullName: lastStudent.full_name,
              grade: lastStudent.grade,
              totalScore: lastStudent.total_score,
              certificateType: lastStudent.certificate_type
            });
          } else {
            // تحميل البيانات المؤقتة من localStorage
            const tempStudent = localStorage.getItem('tempStudentInfo');
            if (tempStudent) {
              try {
                const parsedStudent = JSON.parse(tempStudent);
                if (parsedStudent.fullName) { // فقط إذا كانت البيانات غير فارغة
                  setStudentInfo(parsedStudent);
                }
              } catch (e) {}
            }
          }
        } else {
          // في حالة عدم وجود بيانات في قاعدة البيانات، تحميل البيانات المؤقتة
          const tempGuardian = localStorage.getItem('tempGuardianInfo');
          const tempStudent = localStorage.getItem('tempStudentInfo');
          
          if (tempGuardian) {
            try {
              setGuardianInfo(JSON.parse(tempGuardian));
            } catch (e) {}
          }
          
          if (tempStudent) {
            try {
              setStudentInfo(JSON.parse(tempStudent));
            } catch (e) {}
          }
        }
      } catch (error) {
        console.log('تحميل البيانات المؤقتة...');
        // تحميل البيانات المؤقتة من localStorage
        const tempGuardian = localStorage.getItem('tempGuardianInfo');
        const tempStudent = localStorage.getItem('tempStudentInfo');
        
        if (tempGuardian) {
          try {
            setGuardianInfo(JSON.parse(tempGuardian));
          } catch (e) {}
        }
        
        if (tempStudent) {
          try {
            setStudentInfo(JSON.parse(tempStudent));
          } catch (e) {}
        }
      }
    };

    loadSavedData();
  }, [router]);

  const validateForm = () => {
    const newErrors = {
      guardian: {
        fullName: '',
        mobileNumber: '',
        nationalId: ''
      },
      student: {
        fullName: '',
        grade: '',
        totalScore: '',
        certificateType: ''
      },
      general: ''
    };

    // Guardian validation
    if (!guardianInfo.fullName.trim()) {
      newErrors.guardian.fullName = 'الرجاء إدخال اسم ولي الأمر';
    }

    const egyptPattern = /^(01)[0-9]{9}$/;
    if (!egyptPattern.test(guardianInfo.mobileNumber)) {
      newErrors.guardian.mobileNumber = 'الرجاء إدخال رقم جوال مصري صحيح (01XXXXXXXXX)';
    }

    const nationalIdRegex = /^[0-9]{14}$/;
    if (!nationalIdRegex.test(guardianInfo.nationalId)) {
      newErrors.guardian.nationalId = 'الرجاء إدخال رقم قومي مصري صحيح (14 رقم)';
    }

    // Student validation
    if (!studentInfo.fullName.trim()) {
      newErrors.student.fullName = 'الرجاء إدخال اسم الطالب';
    }

    if (!studentInfo.grade.trim()) {
      newErrors.student.grade = 'الرجاء إدخال الدرجة';
    }

    if (!studentInfo.totalScore.trim()) {
      newErrors.student.totalScore = 'الرجاء إدخال المجموع الكلي';
    }

    if (!studentInfo.certificateType.trim()) {
      newErrors.student.certificateType = 'الرجاء اختيار نوع الشهادة';
    }

    setErrors(newErrors);
    
    const isValid = !Object.values(newErrors.guardian).some(error => error !== '') &&
           !Object.values(newErrors.student).some(error => error !== '');
    
    return isValid;
  };

    const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitStatus(null);

    // Validate form data
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const token = Cookies.get('token');
      
      const response = await fetch('/api/guardian-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          guardian: {
            fullName: guardianInfo.fullName,
            mobileNumber: guardianInfo.mobileNumber,
            nationalId: guardianInfo.nationalId
          },
          student: {
            fullName: studentInfo.fullName,
            grade: studentInfo.grade,
            totalScore: studentInfo.totalScore,
            certificateType: studentInfo.certificateType
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في حفظ البيانات');
      }

      setSubmitStatus({
        type: 'success',
        message: 'تم حفظ بيانات ولي الأمر والطالب بنجاح!'
      });

      // مسح البيانات المؤقتة والقديمة بعد النجاح
      localStorage.removeItem('tempGuardianInfo');
      localStorage.removeItem('tempStudentInfo');
      localStorage.removeItem('completeOrderDetails'); // مسح البيانات القديمة

      // Store order details for next step
      const orderData = {
        guardian: guardianInfo,
        student: studentInfo,
        services: orderDetails?.services || [],
        totalPrice: orderDetails?.totalPrice || 0,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('submittedGuardianData', JSON.stringify(orderData));

      // Navigate to next page after short delay
      setTimeout(() => {
        router.push('/order-details');
      }, 2000);

    } catch (error: any) {
      console.error('حدث خطأ في حفظ البيانات:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'حدث خطأ في حفظ البيانات. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">جاري تحميل تفاصيل الطلب...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            بيانات ولي الأمر والطالب
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            يرجى إدخال البيانات المطلوبة لإتمام الطلب
          </p>
        </div>

        {/* Status Messages */}
        {submitStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : submitStatus.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {submitStatus.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : submitStatus.type === 'info' ? (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium">{submitStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ملخص الطلب</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">عدد الخدمات:</p>
              <p className="font-semibold">{orderDetails.services.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">السعر الإجمالي:</p>
              <p className="font-semibold text-blue-600">{orderDetails.totalPrice} ريال</p>
            </div>
          </div>
        </div>

        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Guardian Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">بيانات ولي الأمر</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل لولي الأمر *
                </label>
                <input
                  type="text"
                  id="guardianName"
                  value={guardianInfo.fullName}
                  onChange={(e) => setGuardianInfo({ ...guardianInfo, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="الاسم الكامل"
                />
                {errors.guardian.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.guardian.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="guardianMobile" className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الجوال *
                </label>
                <input
                  type="tel"
                  id="guardianMobile"
                  value={guardianInfo.mobileNumber}
                  onChange={(e) => setGuardianInfo({ ...guardianInfo, mobileNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                />
                {errors.guardian.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.guardian.mobileNumber}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="guardianNationalId" className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم القومي *
                </label>
                <input
                  type="text"
                  id="guardianNationalId"
                  value={guardianInfo.nationalId}
                  onChange={(e) => setGuardianInfo({ ...guardianInfo, nationalId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="14 رقم"
                  dir="ltr"
                  maxLength={14}
                />
                {errors.guardian.nationalId && (
                  <p className="mt-1 text-sm text-red-600">{errors.guardian.nationalId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">بيانات الطالب</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل للطالب *
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={studentInfo.fullName}
                  onChange={(e) => setStudentInfo({ ...studentInfo, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="الاسم الكامل"
                />
                {errors.student.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.student.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  الدرجة في آخر سنة *
                </label>
                <input
                  type="text"
                  id="grade"
                  value={studentInfo.grade}
                  onChange={(e) => setStudentInfo({ ...studentInfo, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: 95%"
                />
                {errors.student.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.student.grade}</p>
                )}
              </div>

              <div>
                <label htmlFor="totalScore" className="block text-sm font-medium text-gray-700 mb-2">
                  المجموع الكلي *
                </label>
                <input
                  type="text"
                  id="totalScore"
                  value={studentInfo.totalScore}
                  onChange={(e) => setStudentInfo({ ...studentInfo, totalScore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: 410/410"
                />
                {errors.student.totalScore && (
                  <p className="mt-1 text-sm text-red-600">{errors.student.totalScore}</p>
                )}
              </div>

              <div>
                <label htmlFor="certificateType" className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الشهادة *
                </label>
                <select
                  id="certificateType"
                  value={studentInfo.certificateType}
                  onChange={(e) => setStudentInfo({ ...studentInfo, certificateType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر نوع الشهادة</option>
                  <option value="ثانوية عامة">ثانوية عامة</option>
                  <option value="ثانوية أزهرية">ثانوية أزهرية</option>
                  <option value="ثانوية تجارية">ثانوية تجارية</option>
                  <option value="ثانوية صناعية">ثانوية صناعية</option>
                  <option value="ثانوية زراعية">ثانوية زراعية</option>
                  <option value="ثانوية فنية">ثانوية فنية</option>
                  <option value="أخرى">أخرى</option>
                </select>
                {errors.student.certificateType && (
                  <p className="mt-1 text-sm text-red-600">{errors.student.certificateType}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Link
              href="/cart"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              العودة للسلة
            </Link>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`px-8 py-3 rounded-md text-white font-medium transition-colors duration-200 ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'جاري الحفظ...' : 'متابعة للعقد'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 