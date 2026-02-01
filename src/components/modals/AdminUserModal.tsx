"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
  Phone,
} from "lucide-react";
import { User as UserType } from "@/services/userService";

interface AdminUserModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserType>) => Promise<void>;
}

export default function AdminUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: AdminUserModalProps) {
  const [formData, setFormData] = useState<Partial<UserType>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"basic" | "contact">("basic");

  const isEditMode = !!user;

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "USER",
          department: user.department || "",
          phoneNumber: user.phoneNumber || "",
          lineId: user.lineId || "",
        });
      } else {
        setFormData({
          name: "",
          email: "",
          role: "USER",
          department: "",
          phoneNumber: "",
          lineId: "",
        });
      }
      setPassword("");
      setConfirmPassword("");
      setErrors({});
      setActiveTab("basic");
    }
  }, [user, isOpen]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "กรุณากรอกชื่อ";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!isEditMode && !password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    }

    if (password && password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, password, confirmPassword, isEditMode]);

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      if (password) {
        (dataToSave as any).password = password;
      }
      await onSave(dataToSave);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditMode ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditMode ? `ID: ${user?.id}` : "กรอกข้อมูลด้านล่าง"}
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

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === "basic"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            ข้อมูลหลัก
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === "contact"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            ข้อมูลติดต่อ
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      errors.name
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm`}
                    placeholder="ชื่อ นามสกุล"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  อีเมล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      errors.email
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm`}
                    placeholder="email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  บทบาท <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Shield
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={formData.role || "USER"}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as any })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none bg-white cursor-pointer"
                  >
                    <option value="USER">ผู้ใช้ทั่วไป</option>
                    <option value="IT">ทีมไอที</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  {isEditMode ? "เปลี่ยนรหัสผ่าน (ไม่บังคับ)" : "รหัสผ่าน"}
                </h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        errors.password
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm pr-10`}
                      placeholder="รหัสผ่าน"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-500">{errors.password}</p>
                  )}

                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      errors.confirmPassword
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm`}
                    placeholder="ยืนยันรหัสผ่าน"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  แผนก
                </label>
                <input
                  type="text"
                  value={formData.department || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="เช่น IT, HR, Finance"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={formData.phoneNumber || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>

              {/* LINE ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={formData.lineId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lineId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="@line_id"
                />
              </div>

              <div className="pt-4 text-center text-xs text-slate-400">
                ข้อมูลติดต่อจะช่วยในการสื่อสารกับผู้ใช้
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
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
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
