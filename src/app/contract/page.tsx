'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  category: string;
}

interface CompleteOrderDetails {
  services: Service[];
  totalPrice: number;
  timestamp: string;
  guardianInfo: {
    fullName: string;
    mobileNumber: string;
    nationalId: string;
  };
  studentInfo: {
    fullName: string;
    grade: string;
    totalScore: string;
    certificateType: string;
  };
}

export default function ContractPage() {
  const [orderDetails, setOrderDetails] = useState<CompleteOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSigned, setHasSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login?redirectTo=/contract');
        return;
      }

      try {
        const decoded = jwt_decode<DecodedToken>(token);
        if (!decoded) {
          throw new Error('Invalid token');
        }
      } catch (error) {
        Cookies.remove('token');
        router.push('/login?redirectTo=/contract');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const savedCompleteOrderDetails = localStorage.getItem('completeOrderDetails');
    if (savedCompleteOrderDetails) {
      try {
        const parsedDetails = JSON.parse(savedCompleteOrderDetails);
        if (parsedDetails.services && Array.isArray(parsedDetails.services) && 
            parsedDetails.guardianInfo && parsedDetails.studentInfo) {
          setOrderDetails(parsedDetails);
        } else {
          throw new Error('Invalid complete order details format');
        }
      } catch (error) {
        setError('حدث خطأ في تحميل تفاصيل الطلب الكاملة');
        router.push('/guardian-info');
      }
    } else {
      setError('لم يتم العثور على تفاصيل الطلب الكاملة');
      router.push('/guardian-info');
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up high DPI canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set display size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);

    // Set default styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width / dpr),
      y: (e.clientY - rect.top) * (canvas.height / rect.height / dpr)
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSigned(false);
  };

  const generateContractPDF = async () => {
    if (!contractRef.current || !canvasRef.current) return;

    try {
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const contractElement = contractRef.current;
      const signatureCanvas = canvasRef.current;

      // Capture contract content
      const contractCanvas = await html2canvas(contractElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Add contract content to PDF
      const imgData = contractCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);

      // Add signature
      const signatureData = signatureCanvas.toDataURL('image/png');
      pdf.addImage(signatureData, 'PNG', 10, pdf.internal.pageSize.height - 50, 50, 20);

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Get user email from token
      const token = Cookies.get('token');
      if (!token) throw new Error('No token found');

      const decoded = jwt_decode<DecodedToken>(token);
      if (!decoded || !decoded.email) throw new Error('Invalid token');

      // Send PDF to user's email
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'contract.pdf');
      formData.append('email', decoded.email);
      formData.append('name', decoded.name);

      const response = await fetch('/api/send-contract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send contract');
      }

      // Save PDF URL to localStorage for payment page
      localStorage.setItem('contractPdfUrl', pdfUrl);

      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!hasSigned) {
      setError('يرجى التوقيع على العقد قبل المتابعة');
      return;
    }

    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login?redirectTo=/contract');
        return;
      }

      const decoded = jwt_decode<DecodedToken>(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }

      // Generate and save PDF
      await generateContractPDF();

      router.push('/payment');
    } catch (error) {
      setError('حدث خطأ في التحقق من تسجيل الدخول');
      Cookies.remove('token');
      router.push('/login?redirectTo=/contract');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">جاري تحميل العقد...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/guardian-info')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              العودة لبيانات ولي الأمر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">عقد الخدمات التعليمية</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">يرجى قراءة العقد والتوقيع عليه</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div ref={contractRef} className="prose prose-sm max-w-none text-black">
                <h4 className="text-lg font-semibold mb-4">بين الطرفين:</h4>
                <p className="mb-4">
                  الطرف الأول: خدمات تعليمية (المزود)
                  <br />
                  الطرف الثاني: {orderDetails?.guardianInfo.fullName} (ولي الأمر)
                </p>

                <h4 className="text-lg font-semibold mb-4">بيانات ولي الأمر:</h4>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p><strong>الاسم:</strong> {orderDetails?.guardianInfo.fullName}</p>
                  <p><strong>رقم الجوال:</strong> {orderDetails?.guardianInfo.mobileNumber}</p>
                  <p><strong>الرقم القومي:</strong> {orderDetails?.guardianInfo.nationalId}</p>
                </div>

                <h4 className="text-lg font-semibold mb-4">بيانات الطالب:</h4>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p><strong>الاسم:</strong> {orderDetails?.studentInfo.fullName}</p>
                  <p><strong>الدرجة في آخر سنة:</strong> {orderDetails?.studentInfo.grade}</p>
                  <p><strong>المجموع الكلي:</strong> {orderDetails?.studentInfo.totalScore}</p>
                  <p><strong>نوع الشهادة:</strong> {orderDetails?.studentInfo.certificateType}</p>
                </div>

                <h4 className="text-lg font-semibold mb-4">تمهيد:</h4>
                <p className="mb-4">
                  حيث أن الطرف الأول يقدم خدمات تعليمية متنوعة، ورغبة من الطرف الثاني في الاستفادة من هذه الخدمات لصالح الطالب المذكور أعلاه، فقد اتفق الطرفان على ما يلي:
                </p>

                <h4 className="text-lg font-semibold mb-4">الخدمات المطلوبة:</h4>
                <ul className="list-disc mr-6 mb-4">
                  {orderDetails?.services.map((service) => (
                    <li key={service.id} className="mb-2">
                      {service.title} - {service.duration} - {service.price} جنيه مصري
                    </li>
                  ))}
                </ul>

                <h4 className="text-lg font-semibold mb-4">المجموع الكلي:</h4>
                <p className="mb-4 font-semibold">{orderDetails?.totalPrice} جنيه مصري</p>

                <h4 className="text-lg font-semibold mb-4">شروط وأحكام:</h4>
                <ol className="list-decimal mr-6 mb-4">
                  <li className="mb-2">يلتزم الطرف الأول بتقديم الخدمات المتفق عليها بجودة عالية للطالب المذكور.</li>
                  <li className="mb-2">يلتزم الطرف الثاني (ولي الأمر) بدفع المبلغ المتفق عليه كاملاً.</li>
                  <li className="mb-2">يتم إصدار الفاتورة فور إتمام الطلب.</li>
                  <li className="mb-2">يمكن إلغاء الطلب قبل بدء تنفيذ الخدمة.</li>
                  <li className="mb-2">يتم حفظ جميع البيانات الشخصية لولي الأمر والطالب بسرية تامة.</li>
                  <li className="mb-2">يقر ولي الأمر بصحة جميع البيانات المقدمة عن الطالب.</li>
                </ol>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">التوقيع:</h4>
                  <p className="text-sm text-gray-600 mb-2">توقيع ولي الأمر: {orderDetails?.guardianInfo.fullName}</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={200}
                      className="border border-gray-300 rounded-lg w-full cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="mt-2 flex justify-between">
                      <button
                        onClick={clearSignature}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        مسح التوقيع
                      </button>
                      <p className="text-sm text-gray-500">قم بالتوقيع في المساحة أعلاه</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push('/guardian-info')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            العودة لبيانات ولي الأمر
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'جاري المعالجة...' : 'متابعة للدفع'}
          </button>
        </div>
      </div>
    </div>
  );
} 