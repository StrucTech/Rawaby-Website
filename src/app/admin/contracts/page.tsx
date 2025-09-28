'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function ContractsAdminPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const formData = new FormData();
    if (contract1Ref.current?.files?.[0]) {
      formData.append("contract1", contract1Ref.current.files[0]);
    }
    if (contract2Ref.current?.files?.[0]) {
      formData.append("contract2", contract2Ref.current.files[0]);
    }
    try {
      const res = await fetch("/api/admin/contracts/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("تم رفع العقود بنجاح");
      } else {
        setMessage(data.error || "حدث خطأ أثناء الرفع");
      }
    } catch (err) {
      setMessage("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (name: string) => {
    window.open(`/api/admin/contracts/download?name=${name}`, "_blank");
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">إدارة العقود</h1>
      <form onSubmit={handleUpload} className="space-y-4 border p-4 rounded bg-white shadow">
        <div>
          <label className="block mb-1">عقد 1 (Word)</label>
          <input type="file" accept=".doc,.docx" ref={contract1Ref} required className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block mb-1">عقد 2 (Word)</label>
          <input type="file" accept=".doc,.docx" ref={contract2Ref} required className="border p-2 rounded w-full" />
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "جاري الرفع..." : "رفع العقود"}
        </button>
        {message && <div className="mt-2 text-center text-red-600">{message}</div>}
      </form>
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => handleDownload("contract1.docx")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          تحميل عقد 1
        </button>
        <button
          onClick={() => handleDownload("contract2.docx")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          تحميل عقد 2
        </button>
      </div>
    </div>
  );
} 