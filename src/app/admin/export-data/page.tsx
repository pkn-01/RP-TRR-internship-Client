"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  FileJson,
  FileText,
  Wrench,
  Package,
  Users,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/services/api";

// Status labels in Thai
const statusLabels: { [key: string]: string } = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  WAITING_PARTS: "รออะไหล่",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

interface RepairAttachment {
  id: number;
  fileUrl: string;
  filename: string;
  mimeType: string;
}

interface Repair {
  id: string;
  ticketCode: string;
  createdAt: string;
  problemTitle: string;
  problemCategory: string;
  location: string;
  reporterName: string;
  reporterPhone?: string;
  reporterDepartment?: string;
  status: string;
  description?: string;
  urgency?: string;
  attachments?: RepairAttachment[];
}

export default function ExportDataPage() {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json" | "xlsx">(
    "xlsx",
  );
  const [isExporting, setIsExporting] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch repairs data on mount
  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const data = await apiFetch("/api/repairs");
        setRepairs((data as Repair[]) || []);
      } catch (error) {
        console.error("Failed to fetch repairs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  const handleExportRepairs = async () => {
    if (repairs.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ export");
      return;
    }

    try {
      setIsExporting(true);

      // Helper to safely truncate text for Excel (max 32767 chars)
      const safeTruncate = (text: string, maxLength: number = 32000) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...(ตัดทอนเคื่องจากยาวเกินไป)";
      };

      // Prepare data with Thai headers
      const exportData = repairs.map((repair) => ({
        เลขใบงาน: repair.ticketCode,
        วันที่: new Date(repair.createdAt).toLocaleDateString("th-TH"),
        เวลา: new Date(repair.createdAt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ปัญหา: repair.problemTitle,
        สถานที่: repair.location,
        ผู้แจ้ง: repair.reporterName,
        แผนก: repair.reporterDepartment || "-",
        เบอร์โทร: repair.reporterPhone || "-",
        สถานะ: statusLabels[repair.status] || repair.status,
        รายละเอียด: safeTruncate(repair.description || "-", 32000),
      }));

      if (selectedFormat === "xlsx") {
        // Excel export with professional layout
        const wb = XLSX.utils.book_new();

        // 1. Create Data Worksheet
        const ws = XLSX.utils.aoa_to_sheet([
          ["รายงานการแจ้งซ่อม (Repair Report)"],
          [
            `วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")} ${new Date().toLocaleTimeString("th-TH")}`,
          ],
          [""], // Empty row
        ]);

        // Add headers and data starting from row 4 (index 3)
        XLSX.utils.sheet_add_json(ws, exportData, { origin: "A4" });

        // Set column widths
        ws["!cols"] = [
          { wch: 22 }, // เลขใบงาน
          { wch: 12 }, // วันที่
          { wch: 10 }, // เวลา
          { wch: 30 }, // ปัญหา
          { wch: 20 }, // สถานที่
          { wch: 20 }, // ผู้แจ้ง
          { wch: 15 }, // แผนก
          { wch: 15 }, // เบอร์โทร
          { wch: 15 }, // สถานะ
          { wch: 50 }, // รายละเอียด
        ];

        // Merge title cells
        ws["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Merge title across columns
          { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Merge date across columns
        ];

        XLSX.utils.book_append_sheet(wb, ws, "งานซ่อมแซม");
        const fileName = `repairs-export-${new Date().toISOString().split("T")[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
      } else if (selectedFormat === "csv") {
        // CSV export
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(","),
          ...exportData.map((row) =>
            headers
              .map(
                (h) =>
                  `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`,
              )
              .join(","),
          ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `repairs-export-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (selectedFormat === "json") {
        // JSON export
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `repairs-export-${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      alert(
        `ส่งออกข้อมูล ${repairs.length} รายการเป็น ${selectedFormat.toUpperCase()} เรียบร้อย`,
      );
    } catch (error) {
      console.error("Export error:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">นำออกข้อมูล</h1>
        <p className="text-slate-300">
          ส่งออกข้อมูลงานซ่อมแซมในรูปแบบที่ต้องการ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{repairs.length}</p>
          <p className="text-sm text-slate-400">งานทั้งหมด</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {repairs.filter((r) => r.status === "PENDING").length}
          </p>
          <p className="text-sm text-slate-400">รอดำเนินการ</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {repairs.filter((r) => r.status === "IN_PROGRESS").length}
          </p>
          <p className="text-sm text-slate-400">กำลังดำเนินการ</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {repairs.filter((r) => r.status === "COMPLETED").length}
          </p>
          <p className="text-sm text-slate-400">เสร็จสิ้น</p>
        </div>
      </div>

      {/* Export Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Download size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              ส่งออกงานซ่อมแซม
            </h2>
            <p className="text-sm text-slate-400">
              ข้อมูลทั้งหมด {repairs.length} รายการ
            </p>
          </div>
        </div>

        {/* Preview columns */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-slate-300 mb-3">
            คอลัมน์ที่จะส่งออก:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "เลขใบงาน",
              "วันที่",
              "เวลา",
              "ปัญหา",
              "สถานที่",
              "ผู้แจ้ง",
              "แผนก",
              "เบอร์โทร",
              "สถานะ",
              "รายละเอียด",
            ].map((col) => (
              <span
                key={col}
                className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-slate-300"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-300 mb-3">
            เลือกรูปแบบไฟล์:
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "xlsx", label: "EXCEL", icon: FileSpreadsheet },
              { id: "csv", label: "CSV", icon: FileText },
              { id: "json", label: "JSON", icon: FileJson },
            ].map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() =>
                    setSelectedFormat(format.id as "xlsx" | "csv" | "json")
                  }
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    selectedFormat === format.id
                      ? "bg-blue-600/30 border-blue-500 text-blue-300"
                      : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-semibold">{format.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportRepairs}
          disabled={isExporting || isLoading || repairs.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              กำลังส่งออก...
            </>
          ) : isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              กำลังโหลดข้อมูล...
            </>
          ) : (
            <>
              <Download size={20} />
              ส่งออก {repairs.length} รายการ
            </>
          )}
        </button>
      </div>

      {/* Data Preview */}
      {repairs.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">
              ตัวอย่างข้อมูล (5 รายการแรก)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    เลขใบงาน
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    วันที่
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    เวลา
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    ปัญหา
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    สถานที่
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    ผู้แจ้ง
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    แผนก
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    เบอร์โทร
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {repairs.slice(0, 5).map((repair) => (
                  <tr key={repair.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-blue-400 font-mono">
                      {repair.ticketCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(repair.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(repair.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                      {repair.problemTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {repair.location}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {repair.reporterName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {repair.reporterDepartment || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {repair.reporterPhone || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          repair.status === "COMPLETED"
                            ? "bg-green-900/30 text-green-400"
                            : repair.status === "IN_PROGRESS"
                              ? "bg-amber-900/30 text-amber-400"
                              : "bg-blue-900/30 text-blue-400"
                        }`}
                      >
                        {statusLabels[repair.status] || repair.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
