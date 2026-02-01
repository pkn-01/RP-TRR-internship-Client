"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import { DialogConfig } from "./DialogContext";

interface DialogProps extends DialogConfig {
  onClose: () => void;
}

export default function Dialog({
  type,
  title,
  message,
  content,
  icon,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}: DialogProps) {
  const [loading, setLoading] = useState(false);

  const getDefaultIcon = () => {
    if (icon) return icon;

    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6" />;
      case "error":
        return <AlertCircle className="w-6 h-6" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6" />;
      case "info":
        return <Info className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-yellow-50";
      case "info":
        return "bg-blue-50";
      default:
        return "bg-gray-50";
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      setLoading(true);
      try {
        await Promise.resolve(onConfirm());
        onClose();
      } finally {
        setLoading(false);
      }
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-start justify-between ${getBackgroundColor()}`}
        >
          <div className="flex items-start gap-3 flex-1">
            {getDefaultIcon() && (
              <div className={`flex-shrink-0 ${getIconColor()} mt-0.5`}>
                {getDefaultIcon()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {message && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {message}
            </p>
          )}
          {content && <div className="text-gray-700">{content}</div>}
        </div>

        {/* Footer - Actions */}
        {(type === "form" || onConfirm || onCancel) && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            {onCancel && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                disabled={loading || isLoading}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm text-white flex items-center justify-center gap-2 ${
                  isDanger
                    ? "bg-red-600 hover:bg-red-700 disabled:bg-red-600"
                    : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading || isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
