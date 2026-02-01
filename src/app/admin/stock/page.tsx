"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X as XIcon,
  Package,
} from "lucide-react";

interface StockItem {
  id: number;
  code: string;
  name: string;
  quantity: number;
  category: string;
  location: string;
  lastUpdated: string;
}

export default function AdminStockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    quantity: 1,
    category: "",
    location: "",
  });

  const itemsPerPage = 10;

  // Mock data for initial load - replace with actual API when available
  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        // Try to fetch from API, fallback to empty array
        try {
          const data = await apiFetch("/api/stock");
          setStockItems(data || []);
        } catch {
          // API might not exist yet, use empty array
          setStockItems([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  // Stats
  const stats = {
    total: stockItems.length,
    lowStock: stockItems.filter((s) => s.quantity < 5).length,
    outOfStock: stockItems.filter((s) => s.quantity === 0).length,
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    try {
      await apiFetch(`/api/stock/${itemId}`, { method: "DELETE" });
      setStockItems(stockItems.filter((s) => s.id !== itemId));
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleAddStock = async () => {
    if (!formData.name) {
      alert("กรุณากรอกชื่อรายการ");
      return;
    }

    try {
      setIsSaving(true);
      const newItem = await apiFetch("/api/stock", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setStockItems([...stockItems, newItem]);
      setShowModal(false);
      setStockItems([...stockItems, newItem]);
      setShowModal(false);
      setFormData({
        code: "",
        name: "",
        quantity: 1,
        category: "",
        location: "",
      });
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="รายการทั้งหมด" value={stats.total} />
          <StatCard label="ใกล้หมด" value={stats.lowStock} />
          <StatCard label="หมดสต็อก" value={stats.outOfStock} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่ออุปกรณ์ / รหัส / หมวดหมู่"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                ค้นหา
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={16} />
              เพิ่มรายการ
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50">
              Export reprot
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  รหัส
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  ชื่ออุปกรณ์
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  หมวดหมู่
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  จำนวน
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  สถานที่เก็บ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-900">
                      {item.code || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{item.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {item.category || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${item.quantity === 0 ? "text-red-600" : item.quantity < 5 ? "text-amber-600" : "text-gray-900"}`}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {item.location || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Package className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="text-gray-500">ไม่มีรายการในสต็อก</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      เพิ่มรายการใหม่
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {paginatedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-mono text-gray-500 block mb-1">
                    {item.code || "-"}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${item.quantity === 0 ? "text-red-600" : item.quantity < 5 ? "text-amber-600" : "text-gray-900"}`}
                >
                  {item.quantity} ชิ้น
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <p className="text-xs text-gray-500">
                  หมวดหมู่: {item.category || "-"}
                </p>
                <p className="text-xs text-gray-500 text-right">
                  สถานที่: {item.location || "-"}
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
          {paginatedItems.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center">
              <Package className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-gray-500">ไม่มีรายการในสต็อก</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                เพิ่มรายการใหม่
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage}/{totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                เพิ่มรายการสต็อก
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสอุปกรณ์
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="เช่น EQ-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่ออุปกรณ์ *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="ระบุชื่อ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวน
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="เช่น อุปกรณ์สำนักงาน"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานที่เก็บ
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="เช่น ห้อง IT ชั้น 2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddStock}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
