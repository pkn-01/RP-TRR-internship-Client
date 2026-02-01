"use client";

import React from "react";
import { Check } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "ส่งข้อมูลสำเร็จ",
  description,
  buttonText = "OK",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Success Icon Animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full scale-110 animate-ping opacity-25"></div>
            <div className="relative w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
              <Check
                className="text-green-500 w-10 h-10 animate-in zoom-in-50 duration-500"
                strokeWidth={3}
              />
            </div>
          </div>

          {/* Text Content */}
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>

          {description && (
            <p className="text-gray-500 text-sm mb-8">{description}</p>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-24 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
