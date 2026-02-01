"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  Package,
  User,
  Phone,
  Calendar,
  Building2,
} from "lucide-react";

interface LoanFormData {
  itemName: string;
  description: string;
  quantity: number;
  expectedReturnDate: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerDepartment: string;
  borrowerLineId: string;
}

interface LoanModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  initialData?: Partial<LoanFormData> & { id?: number };
  onClose: () => void;
  onSave: (data: LoanFormData) => Promise<void>;
}

export default function LoanModal({
  isOpen,
  isEdit = false,
  initialData,
  onClose,
  onSave,
}: LoanModalProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    itemName: "",
    description: "",
    quantity: 1,
    expectedReturnDate: "",
    borrowerName: "",
    borrowerPhone: "",
    borrowerDepartment: "",
    borrowerLineId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"item" | "borrower">(
    "item",
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Format date for input
        let formattedDate = "";
        if (initialData.expectedReturnDate) {
          const dateObj = new Date(initialData.expectedReturnDate);
          formattedDate = dateObj.toISOString().split("T")[0];
        }
        setFormData({
          itemName: initialData.itemName || "",
          description: initialData.description || "",
          quantity: initialData.quantity || 1,
          expectedReturnDate: formattedDate,
          borrowerName: initialData.borrowerName || "",
          borrowerPhone: initialData.borrowerPhone || "",
          borrowerDepartment: initialData.borrowerDepartment || "",
          borrowerLineId: initialData.borrowerLineId || "",
        });
      } else {
        setFormData({
          itemName: "",
          description: "",
          quantity: 1,
          expectedReturnDate: "",
          borrowerName: "",
          borrowerPhone: "",
          borrowerDepartment: "",
          borrowerLineId: "",
        });
      }
      setErrors({});
      setActiveSection("item");
    }
  }, [isOpen, initialData]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = "กรุณากรอกชื่อของ";
    }

    if (!formData.expectedReturnDate) {
      newErrors.expectedReturnDate = "กรุณาเลือกวันคืน";
    }

    if (formData.quantity < 1) {
      newErrors.quantity = "จำนวนต้องมากกว่า 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async () => {
    if (!validate()) {
      // Switch to section with errors
      if (errors.itemName || errors.quantity || errors.expectedReturnDate) {
        setActiveSection("item");
      }
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? "แก้ไขการยืม" : "เพิ่มการยืมใหม่"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? `รหัส: #${initialData?.id}` : "กรอกข้อมูลด้านล่าง"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveSection("item")}
            className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeSection === "item"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Package size={16} />
            ข้อมูลอุปกรณ์
          </button>
          <button
            onClick={() => setActiveSection("borrower")}
            className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeSection === "borrower"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <User size={16} />
            ข้อมูลผู้ยืม
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          {activeSection === "item" && (
            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่ออุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.itemName
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm`}
                  placeholder="เช่น Notebook Dell, Monitor LG"
                />
                {errors.itemName && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.itemName}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                />
              </div>

              {/* Quantity & Return Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      errors.quantity
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm`}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    วันคืน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedReturnDate: e.target.value,
                        })
                      }
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        errors.expectedReturnDate
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200"
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm`}
                    />
                  </div>
                  {errors.expectedReturnDate && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.expectedReturnDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === "borrower" && (
            <div className="space-y-4">
              {/* Borrower Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อผู้ยืม
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={formData.borrowerName}
                    onChange={(e) =>
                      setFormData({ ...formData, borrowerName: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
              </div>

              {/* Phone & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    เบอร์โทร
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="tel"
                      value={formData.borrowerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          borrowerPhone: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      placeholder="08x-xxx-xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    แผนก
                  </label>
                  <div className="relative">
                    <Building2
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={formData.borrowerDepartment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          borrowerDepartment: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      placeholder="เช่น IT, HR"
                    />
                  </div>
                </div>
              </div>

              {/* LINE ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={formData.borrowerLineId}
                  onChange={(e) =>
                    setFormData({ ...formData, borrowerLineId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  placeholder="@line_id"
                />
              </div>

              <div className="pt-4 text-center text-xs text-slate-400">
                ข้อมูลผู้ยืมจะช่วยในการติดตามการคืน
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
