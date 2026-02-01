"use client";

import { useState } from "react";
import { Trash2, Search, AlertCircle, Filter, Loader2 } from "lucide-react";
import { DeleteRepairModal } from "../../../components/modals/AdminActionModals";

interface Repair {
  id: string;
  code: string;
  title: string;
  status: string;
  createdDate: string;
  requester: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export default function DeleteRepairsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([
    {
      id: "1",
      code: "RPT-2025-001",
      title: "เครื่องคอมพิวเตอร์ชำรุด",
      status: "PENDING",
      createdDate: "2025-01-27",
      requester: "สมชาย",
      priority: "HIGH",
    },
    {
      id: "2",
      code: "RPT-2025-002",
      title: "เครื่องพิมพ์ไม่ทำงาน",
      status: "COMPLETED",
      createdDate: "2025-01-20",
      requester: "สมหญิง",
      priority: "MEDIUM",
    },
    {
      id: "3",
      code: "RPT-2025-003",
      title: "ปัญหาเครือข่าย Wi-Fi",
      status: "IN_PROGRESS",
      createdDate: "2025-01-25",
      requester: "ชาลี",
      priority: "MEDIUM",
    },
  ]);

  const filteredRepairs = repairs.filter(
    (repair) =>
      repair.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.requester.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDeleteModal = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async (reason: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Remove from list
      setRepairs(repairs.filter((r) => r.id !== selectedRepair?.id));
      setIsModalOpen(false);
      setSelectedRepair(null);

      // Show success message
      alert(`ลบรายการซ่อมแซม ${selectedRepair?.code} เรียบร้อยแล้ว`);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-900/30 text-amber-400";
      case "IN_PROGRESS":
        return "bg-blue-900/30 text-blue-400";
      case "COMPLETED":
        return "bg-green-900/30 text-green-400";
      default:
        return "bg-slate-700/30 text-slate-400";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-900/30 text-red-400";
      case "MEDIUM":
        return "bg-yellow-900/30 text-yellow-400";
      case "LOW":
        return "bg-green-900/30 text-green-400";
      default:
        return "bg-slate-700/30 text-slate-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING: "รอการดำเนินการ",
      IN_PROGRESS: "กำลังดำเนินการ",
      COMPLETED: "เสร็จสิ้น",
      CANCELLED: "ยกเลิก",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">ลบรายการซ่อมแซม</h1>
        <p className="text-slate-300">จัดการและลบรายการซ่อมแซมที่ไม่ต้องการ</p>
      </div>

      {/* Warning Banner */}
      <div className="rounded-xl border-2 border-red-700/50 bg-red-900/20 p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-red-900/50 border border-red-700/50 flex items-center justify-center shrink-0">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-red-100 mb-1">⚠️ ข้อระวัง</h3>
          <p className="text-red-200 text-sm">
            การลบข้อมูลนี้ไม่สามารถยกเลิกได้ ข้อมูลทั้งหมดจะถูกลบออกจากระบบถาวร
            โปรดตรวจสอบอย่างระมัดระวังก่อนการลบ
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="ค้นหาเลขที่รายการหรือชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <button className="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium transition-all flex items-center gap-2">
          <Filter size={20} />
          <span>ตัวกรอง</span>
        </button>
      </div>

      {/* Results Info */}
      <div className="text-sm text-slate-400">
        พบ {filteredRepairs.length} รายการ
      </div>

      {/* Repairs Table */}
      <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-700/30">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  เลขที่รายการ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  ชื่องาน
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  ผู้ขอ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  ความเร่งด่วน
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-200">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredRepairs.length > 0 ? (
                filteredRepairs.map((repair) => (
                  <tr
                    key={repair.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-blue-400">
                      {repair.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200 max-w-xs truncate">
                      {repair.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200">
                      {repair.requester}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          repair.status,
                        )}`}
                      >
                        {getStatusLabel(repair.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(
                          repair.priority,
                        )}`}
                      >
                        {repair.priority === "HIGH"
                          ? "สูง"
                          : repair.priority === "MEDIUM"
                            ? "ปานกลาง"
                            : "ต่ำ"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(repair.createdDate).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenDeleteModal(repair)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        <Trash2 size={16} />
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-slate-400">ไม่พบรายการซ่อมแซม</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Repair Modal */}
      {selectedRepair && (
        <DeleteRepairModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRepair(null);
          }}
          repairId={selectedRepair.id}
          repairCode={selectedRepair.code}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
