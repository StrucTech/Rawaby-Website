'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export default function TestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = Cookies.get('token');
    setToken(savedToken || null);

    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        setDecodedToken(decoded);
      } catch (err) {
        setError('Token is invalid');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">صفحة الاختبار</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">حالة التوكن:</h2>
          
          {token ? (
            <div className="space-y-4">
              <p className="text-green-600">✅ التوكن موجود</p>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-mono break-all">{token}</p>
              </div>
              
              {decodedToken && (
                <div>
                  <h3 className="font-semibold mb-2">محتوى التوكن:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(decodedToken, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">❌ لا يوجد توكن</p>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 