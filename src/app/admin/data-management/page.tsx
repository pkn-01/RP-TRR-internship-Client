"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCcw,
  CheckSquare,
  Wrench,
  Ticket,
  Clock,
  Bell,
  Package,
  Users,
} from "lucide-react";
import {
  dataManagementService,
  DataTypeInfo,
} from "@/services/dataManagementService";
import Swal from "sweetalert2";

export default function DataManagementPage() {
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [exportFirst, setExportFirst] = useState(true);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDataTypes();
  }, []);

  const fetchDataTypes = async () => {
    try {
      setLoading(true);
      const types = await dataManagementService.getDataTypes();
      setDataTypes(types);
    } catch (error) {
      console.error("Failed to fetch data types:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลประเภทข้อมูลได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === dataTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(dataTypes.map((t) => t.key));
    }
  };

  const handleClearData = async () => {
    if (selectedTypes.length === 0) return;

    const result = await Swal.fire({
      title: "ยืนยันการลบข้อมูล?",
      text: `คุณกำลังจะลบข้อมูล ${selectedTypes.length} รายการ. การกระทำนี้ไม่สามารถย้อนกลับได้!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
      input: "text",
      inputPlaceholder: 'พิมพ์ "ยืนยัน" เพื่อดำเนินการ',
      inputValidator: (value) => {
        if (value !== "ยืนยัน") {
          return 'กรุณาพิมพ์ "ยืนยัน"';
        }
      },
    });

    if (result.isConfirmed) {
      try {
        setProcessing(true);
        const response = await dataManagementService.clearData(
          selectedTypes,
          exportFirst,
        );

        if (exportFirst) {
          const responseCallback = response.data; // Blob is in .data

          // Check if response is JSON (error) or Blob (file)
          const isJson =
            responseCallback instanceof Blob &&
            responseCallback.type === "application/json";

          if (isJson) {
            // It's an error in JSON format, wrapped in a Blob
            const text = await responseCallback.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || "Export failed");
          }

          // Handle successful file download
          const contentDisposition = response.headers["content-disposition"];
          let filename = `data-backup-${new Date().toISOString().split("T")[0]}.xlsx`; // Default

          if (contentDisposition) {
            const filenameMatch =
              contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          } else if (responseCallback.type === "application/zip") {
            filename = `data-backup-${new Date().toISOString().split("T")[0]}.zip`;
          }

          const url = window.URL.createObjectURL(new Blob([responseCallback]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }

        await Swal.fire({
          icon: "success",
          title: "ลบข้อมูลสำเร็จ",
          text: exportFirst
            ? "ลบข้อมูลและดาวน์โหลดไฟล์ Backup เรียบร้อยแล้ว"
            : "ลบข้อมูลเรียบร้อยแล้ว",
        });

        // Refresh counts
        fetchDataTypes();
        setSelectedTypes([]);
      } catch (error: any) {
        console.error("Failed to clear data:", error);

        let errorMessage = "ไม่สามารถลบข้อมูลได้";
        if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorMessage,
        });
      } finally {
        setProcessing(false);
      }
    }
  };

  const totalRecords = dataTypes
    .filter((t) => selectedTypes.includes(t.key))
    .reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-red-600" />
            จัดการข้อมูลระบบ
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            จัดการ ลบ และสำรองข้อมูลของระบบทั้งหมด
          </p>
        </div>
        <button
          onClick={fetchDataTypes}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare size={20} className="text-gray-400" />
                เลือกข้อมูลที่ต้องการจัดการ
              </h2>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {selectedTypes.length === dataTypes.length
                  ? "ยกเลิกทั้งหมด"
                  : "เลือกทั้งหมด"}
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-sm">กำลังโหลดข้อมูล...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataTypes.map((type) => (
                    <div
                      key={type.key}
                      onClick={() => handleToggleType(type.key)}
                      className={`relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedTypes.includes(type.key)
                          ? "border-red-500 bg-red-50/30"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm transition-colors ${
                            selectedTypes.includes(type.key)
                              ? "bg-red-500 text-white"
                              : "bg-white border border-gray-200 text-gray-500 group-hover:border-gray-300"
                          }`}
                        >
                          {selectedTypes.includes(type.key) ? (
                            <CheckCircle size={20} />
                          ) : (
                            (() => {
                              const Icon =
                                {
                                  Wrench,
                                  Ticket,
                                  Clock,
                                  Bell,
                                  Package,
                                  Users,
                                }[type.icon] || Database;
                              return <Icon size={20} />;
                            })()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900">
                              {type.label}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                type.count > 0
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-gray-50 text-gray-300"
                              }`}
                            >
                              {type.count}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trash2 size={20} className="text-red-500" />
              สรุปรายการ
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">รายการที่เลือก</span>
                  <span className="font-bold text-gray-900">
                    {selectedTypes.length} ประเภท
                  </span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm font-medium">รวมข้อมูลทั้งหมด</span>
                  <span className="font-bold text-xl">{totalRecords}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={exportFirst}
                      onChange={(e) => setExportFirst(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-blue-600" />
                      สำรองข้อมูลก่อนลบ
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      ระบบจะส่งออกไฟล์ Excel ให้ก่อนที่จะทำการลบข้อมูลถาวร
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleClearData}
                  disabled={selectedTypes.length === 0 || processing}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-xl font-medium shadow-sm hover:bg-red-700 focus:ring-4 focus:ring-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <Trash2 size={20} />
                      ลบข้อมูลที่เลือก ({totalRecords})
                    </>
                  )}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3 items-start">
                <p className="text-xs text-amber-700 leading-relaxed">
                  ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้
                  กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
