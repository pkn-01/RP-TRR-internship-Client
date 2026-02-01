"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface DeleteRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairId?: string;
  repairCode?: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function DeleteRepairModal({
  isOpen,
  onClose,
  repairId,
  repairCode,
  onConfirm,
}: DeleteRepairModalProps) {
  const [deleteReason, setDeleteReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!deleteReason.trim()) {
      alert("กรุณาระบุเหตุผลการลบ");
      return;
    }

    try {
      setIsConfirming(true);
      await onConfirm(deleteReason);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setDeleteReason("");
        onClose();
      }, 2000);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
        {showSuccess ? (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="text-green-500" size={48} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              ลบสำเร็จ
            </h3>
            <p className="text-slate-400 text-sm">
              รายการซ่อมแซมถูกลบออกจากระบบแล้ว
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-900/30 border border-red-700/50 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">
                  ลบรายการซ่อมแซม
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ การกระทำนี้ไม่สามารถยกเลิกได้
                </p>
                <p className="text-slate-300 text-sm mt-2">
                  การลบข้อมูลนี้จะลบทั้งหมดออกจากระบบ
                </p>
              </div>

              {repairCode && (
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">
                    รายการซ่อม:{" "}
                    <span className="text-blue-400">{repairCode}</span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  เหตุผลการลบ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="ระบุเหตุผลที่ต้องลบรายการนี้..."
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-700">
              <button
                onClick={onClose}
                disabled={isConfirming}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium transition-all disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming || !deleteReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    ยืนยันการลบ
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (
    format: "csv" | "json" | "pdf" | "xlsx",
    dataType: string,
  ) => Promise<void>;
}

export function ExportDataModal({
  isOpen,
  onClose,
  onExport,
}: ExportDataModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<
    "csv" | "json" | "pdf" | "xlsx"
  >("csv");
  const [selectedDataType, setSelectedDataType] = useState("repairs");
  const [isExporting, setIsExporting] = useState(false);

  const dataTypes = [
    { value: "repairs", label: "รายการซ่อมแซมทั้งหมด" },
    { value: "users", label: "ข้อมูลผู้ใช้" },
    { value: "loans", label: "บันทึกยืม-คืนอุปกรณ์" },
    { value: "analytics", label: "สถิติและรายงาน" },
    { value: "audit-logs", label: "บันทึกการเข้าถึง" },
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport(selectedFormat, selectedDataType);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการนำออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-900/30 border border-green-700/50 flex items-center justify-center">
              <Download size={20} className="text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">
              นำออกข้อมูล
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              เลือกข้อมูลที่ต้องการ
            </label>
            <div className="space-y-2">
              {dataTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="dataType"
                    value={type.value}
                    checked={selectedDataType === type.value}
                    onChange={(e) => setSelectedDataType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 text-slate-200 text-sm font-medium">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              รูปแบบไฟล์
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["csv", "json", "pdf", "xlsx"].map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
                    selectedFormat === format
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  {format === "xlsx" ? "EXCEL" : format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium transition-all disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังนำออก...
              </>
            ) : (
              <>
                <Download size={18} />
                นำออก
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  isDangerous = false,
  isLoading = false,
  onConfirm,
}: ConfirmActionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onClose();
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                กำลังดำเนิน...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
