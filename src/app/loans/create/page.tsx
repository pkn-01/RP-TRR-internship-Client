'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/services/api';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function CreateLoanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    quantity: 1,
    expectedReturnDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.itemName.trim()) newErrors.itemName = 'กรุณากรอกชื่อของ';
    if (!formData.expectedReturnDate) newErrors.expectedReturnDate = 'กรุณาเลือกวันที่คาดว่าจะคืน';
    if (formData.quantity < 1) newErrors.quantity = 'จำนวนต้องมากกว่า 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/loans', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response) {
        router.push('/loans');
      }
    } catch (error) {
      console.error('Failed to create loan:', error);
      setErrors({ submit: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/loans" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft size={18} />
            <span>กลับไป</span>
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900">บันทึกการยืมของใหม่</h1>
          <p className="text-zinc-500 mt-2">กรอกรายละเอียดของที่ต้องการยืม</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Item Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                ชื่อของที่ยืม *
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="เช่น หนังสือ, ลูกบอล, อุปกรณ์"
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
              />
              {errors.itemName && <p className="text-red-600 text-sm mt-1">{errors.itemName}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายสภาพของหรือรายละเอียดเพิ่มเติม"
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all resize-none"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                จำนวน *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
              />
              {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                วันที่คาดว่าจะคืน *
              </label>
              <input
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
              />
              {errors.expectedReturnDate && <p className="text-red-600 text-sm mt-1">{errors.expectedReturnDate}</p>}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-900 rounded-lg font-medium hover:bg-zinc-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    บันทึกการยืม
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
