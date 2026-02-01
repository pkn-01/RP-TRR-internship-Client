"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { User } from "@/services/userService";

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  isViewOnly?: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<void>;
}

export default function UserModal({
  user,
  isOpen,
  isViewOnly = false,
  onClose,
  onSave,
}: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        lineId: user.lineId,
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        email: "",
        role: "USER",
        department: "",
        phoneNumber: "",
      });
    }
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setShowPasswordSection(false);
    setFormErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = "ชื่อจำเป็น";
    }
    if (!formData.email?.trim()) {
      errors.email = "อีเมลจำเป็น";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (showPasswordSection && passwordData.newPassword) {
      if (passwordData.newPassword.length < 6) {
        errors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
      } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        errors.password = "รหัสผ่านไม่ตรงกัน";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      if (showPasswordSection && passwordData.newPassword) {
        (dataToSave as any).password = passwordData.newPassword;
      }
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed";

  const errorClasses = "text-xs text-red-500 mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {user ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
              ข้อมูลตัวตน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isLoading}
                  placeholder="เช่น นายสมชาย"
                />
                {formErrors.name && (
                  <p className={errorClasses}>{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className={inputClasses}
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  placeholder="user@example.com"
                />
                {formErrors.email && (
                  <p className={errorClasses}>{formErrors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role & Department Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
              สิทธิ์และสังกัด
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  บทบาท <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClasses}
                  value={formData.role || "USER"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                  disabled={isLoading}
                >
                  <option value="USER">ผู้ใช้งานทั่วไป</option>
                  <option value="IT">ทีมไอที</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แผนก
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="เช่น IT, HR"
                  value={formData.department || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
              ช่องทางติดต่อ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  className={inputClasses}
                  placeholder="08x-xxx-xxxx"
                  value={formData.phoneNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LINE ID
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="Line ID"
                  value={formData.lineId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lineId: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          {!isViewOnly && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showPasswordSection ? "ซ่อนการ" : "แสดง"} เปลี่ยนรหัสผ่าน
              </button>

              {showPasswordSection && (
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {formErrors.password && (
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ {formErrors.password}
                    </p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="ระบุรหัสผ่านใหม่"
                        className={inputClasses}
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          });
                          setFormErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.password;
                            return newErrors;
                          });
                        }}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ยืนยันรหัสผ่าน
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="ระบุรหัสผ่านใหม่อีกครั้ง"
                        className={inputClasses}
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          });
                          setFormErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.password;
                            return newErrors;
                          });
                        }}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                บันทึก
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
