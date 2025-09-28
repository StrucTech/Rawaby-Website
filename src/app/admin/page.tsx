import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">لوحة تحكم الإدارة</h1>
      <div className="grid gap-6">
        <Link href="/admin/services" className="block bg-orange-600 text-white rounded p-6 text-xl text-center hover:bg-orange-700 transition">إدارة الخدمات</Link>
        <Link href="/admin/supervisors" className="block bg-blue-600 text-white rounded p-6 text-xl text-center hover:bg-blue-700 transition">إدارة المشرفين</Link>
        <Link href="/admin/delegates" className="block bg-green-600 text-white rounded p-6 text-xl text-center hover:bg-green-700 transition">إدارة المندوبين</Link>
        <Link href="/admin/tasks" className="block bg-purple-600 text-white rounded p-6 text-xl text-center hover:bg-purple-700 transition">توزيع ومتابعة المهام</Link>
      </div>
    </div>
  );
} 