"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X as XIcon,
} from "lucide-react";

interface Loan {
  id: number;
  itemName: string;
  description?: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
  returnDate?: string;
  status: "BORROWED" | "RETURNED" | "OVERDUE" | "PENDING";
  borrowedBy: {
    id: number;
    name: string;
    department?: string;
    phoneNumber?: string;
  };
  remark?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  BORROWED: { label: "กำลังยืม", color: "text-amber-700", bg: "bg-amber-50" },
  RETURNED: { label: "คืนสำเร็จ", color: "text-green-700", bg: "bg-green-50" },
  OVERDUE: { label: "เกินกำหนด", color: "text-red-700", bg: "bg-red-50" },
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
    borrowDate: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    borrowerId: null as number | null,
    borrowerSearch: "",
    remark: "",
  });
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const itemsPerPage = 10;

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Stats
  const stats = {
    total: loans.length,
    active: loans.filter((l) => l.status === "BORROWED").length,
    overdue: loans.filter((l) => l.status === "OVERDUE").length,
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
    if (!confirm("ลบรายการยืมนี้?")) return;
    try {
      await apiFetch(`/api/loans/${loanId}`, { method: "DELETE" });
      fetchLoans();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleSearchUsers = async (query: string) => {
    setFormData((prev) => ({ ...prev, borrowerSearch: query }));
    if (query.length < 2) {
      setUserResults([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      const data = await apiFetch(
        `/users/search?q=${encodeURIComponent(query)}`,
      );
      setUserResults(data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAddLoan = async () => {
    if (
      !formData.itemName ||
      !formData.expectedReturnDate ||
      !formData.borrowerId
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await apiFetch("/api/loans", {
        method: "POST",
        body: JSON.stringify({
          itemName: formData.itemName,
          description: formData.description || "",
          quantity: formData.quantity || 1,
          borrowDate: new Date(formData.borrowDate).toISOString(),
          expectedReturnDate: new Date(
            formData.expectedReturnDate,
          ).toISOString(),
          borrowerId: formData.borrowerId,
          remark: formData.remark || "",
        }),
      });
      setShowModal(false);
      setFormData({
        itemName: "",
        description: "",
        quantity: 1,
        borrowDate: new Date().toISOString().split("T")[0],
        expectedReturnDate: "",
        borrowerId: null,
        borrowerSearch: "",
        remark: "",
      });
      setUserResults([]);
      fetchLoans();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrowedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
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
          <StatCard label="รายการคืนทั้งหมด" value={stats.total} />
          <StatCard label="กำลังยืม" value={stats.active} />
          <StatCard label="เกินกำหนด" value={stats.overdue} />
          <StatCard label="คืนสำเร็จแล้ว" value={stats.returned} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่ออุปกรณ์/ชื่อผู้รับผิดชอบ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                ค้นหา
              </button>
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
              <option value="OVERDUE">เกินกำหนด</option>
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
                  ผู้รับผิดชอบ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  กำหนดคืน
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
                      {loan.borrowedBy.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {new Date(loan.expectedReturnDate).toLocaleDateString(
                        "th-TH",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
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
                ผู้ยืม: {loan.borrowedBy.name}
              </p>
              <p className="text-xs text-gray-500">
                กำหนดคืน:{" "}
                {new Date(loan.expectedReturnDate).toLocaleDateString("th-TH", {
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                เพิ่มการยืมใหม่
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
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่ออุปกรณ์ *
                  </label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({ ...formData, itemName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="กรอกชื่ออุปกรณ์"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน *
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้รับผิดชอบ (ค้นหาชื่อ) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.borrowerSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 pl-9"
                    placeholder="ค้นหาชื่อพนักงาน..."
                  />
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  {isSearchingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {userResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {userResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            borrowerId: user.id,
                            borrowerSearch: user.name,
                          });
                          setUserResults([]);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex flex-col"
                      >
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500">
                          {user.department || "ไม่ระบุแผนก"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่ยืม
                  </label>
                  <input
                    type="date"
                    value={formData.borrowDate}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    กำหนดคืน *
                  </label>
                  <input
                    type="date"
                    min={formData.borrowDate}
                    value={formData.expectedReturnDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedReturnDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
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
                onClick={handleAddLoan}
                disabled={
                  isSaving ||
                  !formData.itemName ||
                  !formData.expectedReturnDate ||
                  !formData.borrowerId
                }
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
