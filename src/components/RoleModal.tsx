"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RoleModalProps {
  isOpen: boolean;
  role?: { id: string; name: string; permissions: string[] } | null;
  onClose: () => void;
  onSave: (data: { name: string; permissions: string[] }) => Promise<void>;
  availablePermissions?: Permission[];
  isLoading?: boolean;
}

export default function RoleModal({
  isOpen,
  role,
  onClose,
  onSave,
  availablePermissions = [],
  isLoading = false,
}: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role && isOpen) {
      setFormData({
        name: role.name,
        permissions: role.permissions,
      });
    } else if (isOpen) {
      setFormData({ name: "", permissions: [] });
    }
    setErrors({});
  }, [role, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "ชื่อบทบาทจำเป็น";
    }
    if (formData.permissions.length === 0) {
      newErrors.permissions = "เลือกสิทธิ์อย่างน้อย 1 รายการ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {role ? "แก้ไขบทบาท" : "เพิ่มบทบาทใหม่"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อบทบาท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSubmitting || isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="เช่น IT Manager"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สิทธิ์{" "}
                {errors.permissions && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                {availablePermissions.length > 0 ? (
                  availablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        disabled={isSubmitting || isLoading}
                        className="mt-1 rounded border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {perm.name}
                        </p>
                        {perm.description && (
                          <p className="text-xs text-gray-500">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    ไม่มีสิทธิ์ที่ใช้ได้
                  </p>
                )}
              </div>
              {errors.permissions && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.permissions}
                </p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  บันทึก
                </>
              ) : (
                "บันทึก"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
