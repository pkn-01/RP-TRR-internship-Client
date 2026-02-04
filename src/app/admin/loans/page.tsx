"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { apiFetch } from "@/services/api";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X as XIcon,
  Package,
  User,
  Check,
  Phone,
  Building,
  AtSign,
} from "lucide-react";

interface Loan {
  id: number;
  itemName: string;
  description?: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
  returnDate?: string;
  status: "BORROWED" | "RETURNED" | "PENDING";
  borrowedBy: {
    id: number;
    name: string;
    department?: string;
    phoneNumber?: string;
    lineId?: string;
  };
  borrowerName?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  BORROWED: { label: "กำลังยืม", color: "text-amber-700", bg: "bg-amber-50" },
  RETURNED: { label: "คืนสำเร็จ", color: "text-green-700", bg: "bg-green-50" },
  PENDING: { label: "รออนุมัติ", color: "text-blue-700", bg: "bg-blue-50" },
};

function AdminLoansContent() {
  const searchParams = useSearchParams();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    quantity: 1,
    borrowerName: "",
    department: "",
    phoneNumber: "",
    lineId: "",
  });

  const itemsPerPage = 10;

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Stats
  const stats = {
    total: loans.length,
    active: loans.filter((l) => l.status === "BORROWED").length,
    returned: loans.filter((l) => l.status === "RETURNED").length,
  };

  // Read status from URL
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setFilterStatus(status);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/loans/admin/all");
      setLoans(data || []);
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (loanId: number) => {
    const result = await Swal.fire({
      title: "ลบรายการยืมนี้?",
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/api/loans/${loanId}`, { method: "DELETE" });
      await Swal.fire("ลบสำเร็จ!", "รายการยืมถูกลบแล้ว", "success");
      fetchLoans();
    } catch {
      Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดในการลบ", "error");
    }
  };

  const handleAddLoan = async () => {
    if (!formData.itemName || !formData.borrowerName) {
      return;
    }

    try {
      setIsSaving(true);
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      await apiFetch("/api/loans", {
        method: "POST",
        body: JSON.stringify({
          itemName: formData.itemName,
          description: formData.description || "",
          quantity: formData.quantity || 1,
          borrowDate: today.toISOString(),
          expectedReturnDate: nextWeek.toISOString(),
          borrowerName: formData.borrowerName,
          department: formData.department,
          phoneNumber: formData.phoneNumber,
          lineId: formData.lineId,
        }),
      });
      setShowModal(false);
      setFormData({
        itemName: "",
        description: "",
        quantity: 1,
        borrowerName: "",
        department: "",
        phoneNumber: "",
        lineId: "",
      });
      fetchLoans();
    } catch (err: any) {
      Swal.fire("เกิดข้อผิดพลาด", err.message || "ไม่สามารถบันทึกได้", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrowedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrowerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || loan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const paginatedLoans = filteredLoans.slice(
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            className="bg-blue-500 text-white"
            label="รายการยืมทั้งหมด"
            value={stats.total}
          />
          <StatCard
            className="bg-yellow-500 text-white"
            label="กำลังยืม"
            value={stats.active}
          />
          <StatCard
            className="bg-green-500 text-white"
            label="คืนสำเร็จแล้ว"
            value={stats.returned}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่ออุปกรณ์/ชื่อผู้ยืม"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="BORROWED">กำลังยืม</option>
              <option value="RETURNED">คืนแล้ว</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={16} />
              เพิ่มรายการยืม
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
                  อุปกรณ์
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  ชื่อผู้ยืม
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  วันที่ยืม
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {loan.itemName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {loan.borrowerName || loan.borrowedBy?.name || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {new Date(loan.borrowDate).toLocaleDateString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[loan.status]?.bg} ${statusConfig[loan.status]?.color}`}
                    >
                      {statusConfig[loan.status]?.label || loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedLoans.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    ไม่พบรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {paginatedLoans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {loan.itemName}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig[loan.status]?.bg} ${statusConfig[loan.status]?.color}`}
                >
                  {statusConfig[loan.status]?.label || loan.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                ผู้ยืม: {loan.borrowerName || loan.borrowedBy?.name || "-"}
              </p>
              <p className="text-xs text-gray-500">
                วันที่ยืม:{" "}
                {new Date(loan.borrowDate).toLocaleDateString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(loan.id)}
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
          {paginatedLoans.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              ไม่พบรายการ
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
          <div className="bg-white rounded-xl p-0 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                บันทึกการยืมใหม่
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Device Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-700">
                      ข้อมูลอุปกรณ์
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ชื่ออุปกรณ์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.itemName}
                      onChange={(e) =>
                        setFormData({ ...formData, itemName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400"
                      placeholder="เช่น คอมพิวเตอร์, โทรศัพท์มือถือ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      รายละเอียด/Serial No.
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400 resize-none"
                      placeholder="ระบุเลข Serial หรือรายละเอียดเพิ่มเติม"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      จำนวน
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-32 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-center"
                    />
                  </div>
                </div>

                {/* Right Column: Borrower Info */}
                <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-700">
                      ข้อมูลผู้ยืม
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ชื่อผู้ยืม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.borrowerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          borrowerName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                      placeholder="ระบุชื่อผู้ยืม"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      แผนก
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Building size={16} />
                      </div>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        placeholder="ระบุแผนก"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เบอร์โทรศัพท์
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone size={16} />
                      </div>
                      <input
                        type="text"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        placeholder="0xx-xxx-xxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Line ID
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <AtSign size={16} />
                      </div>
                      <input
                        type="text"
                        value={formData.lineId}
                        onChange={(e) =>
                          setFormData({ ...formData, lineId: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex justify-between gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddLoan}
                disabled={
                  isSaving || !formData.itemName || !formData.borrowerName
                }
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    ยืนยันการบันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  className,
}: {
  label: string;
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-lg ${className || "bg-gray-200"}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-2">
        <span className={`text-3xl font-bold ${color || "text-gray-900"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function AdminLoansPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <AdminLoansContent />
    </Suspense>
  );
}
