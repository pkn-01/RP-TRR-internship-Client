"use client";

import React, { useState, ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "phone";
  required?: boolean;
  placeholder?: string;
  value?: string | number;
  error?: string;
  options?: { label: string; value: string | number }[];
  maxLength?: number;
  min?: number;
  max?: number;
  readOnly?: boolean;
  hint?: string;
}

interface FormModalProps {
  isOpen: boolean;
  title: string;
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onSubmit: (data: Record<string, string | number>) => Promise<void>;
  onCancel: () => void;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
  isDanger?: boolean;
}

export default function FormModal({
  isOpen,
  title,
  fields,
  submitText = "บันทึก",
  cancelText = "ยกเลิก",
  onSubmit,
  onCancel,
  children,
  size = "md",
  isDanger = false,
}: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  const validateField = (field: FormField, value: string | number): string => {
    if (field.required && !value) {
      return `${field.label} จำเป็น`;
    }
    if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return "รูปแบบอีเมลไม่ถูกต้อง";
      }
    }
    if (field.type === "password" && value && String(value).length < 6) {
      return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    }
    if (field.type === "phone" && value) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(String(value))) {
        return "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
      }
    }
    return "";
  };

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = formData[field.name] ?? "";
      const error = validateField(field, value);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({});
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? field.value ?? "";
    const error = errors[field.name];

    const inputClasses = `
      w-full px-3 py-2 border rounded-lg transition-colors
      ${
        error
          ? "border-red-500 bg-red-50 focus:ring-red-500"
          : "border-gray-300 bg-white focus:ring-blue-500"
      }
      focus:outline-none focus:ring-2 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
      text-sm
    `;

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.readOnly || isSubmitting}
            maxLength={field.maxLength}
            rows={4}
            className={inputClasses}
          />
        );

      case "select":
        return (
          <select
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={field.readOnly || isSubmitting}
            className={inputClasses}
          >
            <option value="">เลือก {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "phone":
        return (
          <input
            type="tel"
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.readOnly || isSubmitting}
            maxLength={field.maxLength}
            className={inputClasses}
          />
        );

      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.readOnly || isSubmitting}
            maxLength={field.maxLength}
            min={field.min}
            max={field.max}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden transform transition-all animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field)}
                {field.hint && (
                  <p className="mt-1 text-xs text-gray-500">{field.hint}</p>
                )}
                {errors[field.name] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
            {children}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm text-white flex items-center justify-center gap-2 ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                submitText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
