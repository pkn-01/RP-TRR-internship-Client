"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import { uploadData } from "@/services/uploadService";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  Camera,
  MapPinHouse,
  Phone,
  X,
  Building2,
  User,
  ShieldAlert,
  CirclePlus,
  Pencil,
  ChevronDown,
} from "lucide-react";

// Pre-imported SweetAlert for faster alerts
const showAlert = (options: {
  icon?: "success" | "error" | "warning";
  title: string;
  text?: string;
  confirmButtonColor?: string;
}) => {
  return Swal.fire(options);
};

const URGENCY_OPTIONS = [
  {
    id: "NORMAL",
    label: "ปกติ",
    color: "!bg-green-500 hover:!bg-green-600 !text-gray-900",
  },
  {
    id: "URGENT",
    label: "ด่วน",
    color: "!bg-yellow-400 hover:!bg-yellow-500 !text-gray-900",
  },
  {
    id: "CRITICAL",
    label: "ด่วนมาก",
    color: "!bg-red-500 hover:!bg-red-600 !text-gray-900",
  },
];

function RepairFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    phone: "",
    issueType: "",
    details: "",
    urgency: "NORMAL",
    location: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ ticketCode: string } | null>(
    null,
  );
  const [lineUserId, setLineUserId] = useState(
    searchParams.get("lineUserId") || "",
  );
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [linePictureUrl, setLinePictureUrl] = useState("");

  // Initialize LIFF - optimized for speed
  useEffect(() => {
    let isMounted = true;

    // Skip LIFF init if we already have lineUserId from URL params
    const urlLineUserId = searchParams.get("lineUserId");
    if (urlLineUserId) {
      return;
    }

    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) return;

        const liff = (await import("@line/liff")).default;

        // Check if already initialized
        if (!liff.id) {
          // Reduced timeout from 10s to 5s for faster failure
          const initPromise = liff.init({ liffId });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("LIFF initialization timeout")),
              5000,
            ),
          );
          await Promise.race([initPromise, timeoutPromise]);
        }

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          if (isMounted) {
            setLineUserId(profile.userId);
            setLineDisplayName(profile.displayName);
            setLinePictureUrl(profile.pictureUrl || "");
          }
        } else {
          liff.login();
        }
      } catch (error) {
        console.error("LIFF Init Error:", error);
        // Don't show alert for timeout - just continue with form
        // User can still submit the form without LINE profile
      }
    };

    initLiff();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        // Use object URL for faster preview and lower memory usage
        const url = URL.createObjectURL(selectedFile);
        setFilePreview(url);
      }
    },
    [],
  );

  const clearFile = useCallback(() => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(null);
    setFilePreview(null);
  }, [filePreview]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dept) {
      await showAlert({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาระบุแผนกของคุณ",
      });
      return;
    }

    setIsLoading(true);
    try {
      const dataPayload = {
        reporterName: formData.name.trim() || lineDisplayName || "ไม่ระบุชื่อ",
        reporterLineId: lineUserId || "Guest",
        reporterDepartment: formData.dept,
        reporterPhone: formData.phone || "-",
        problemTitle: formData.issueType,
        problemDescription: formData.details,
        location: formData.location,
        urgency: formData.urgency,
        problemCategory: "OTHER",
        displayName: lineDisplayName || undefined,
        pictureUrl: linePictureUrl || undefined,
      };

      const response = await uploadData(
        "/api/repairs/liff/create",
        dataPayload,
        file || undefined,
      );

      // Show success state instead of SweetAlert
      setSuccessData({ ticketCode: response.ticketCode });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง";
      await showAlert({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset form for new request
  const handleNewRequest = () => {
    setSuccessData(null);
    setFormData({
      name: "",
      dept: "",
      phone: "",
      issueType: "",
      details: "",
      urgency: "NORMAL",
      location: "",
    });
    setFile(null);
    setFilePreview(null);
  };

  // Success Page
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50/50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            ส่งเรื่องแจ้งซ่อมสำเร็จ
          </h1>
          <p className="text-slate-500 mb-6">
            ทีมงานจะดำเนินการตรวจสอบโดยเร็วที่สุด
          </p>

          {/* Ticket Code Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <p className="text-sm text-slate-500 mb-2">รหัสการแจ้งซ่อม</p>
            <p className="text-2xl font-mono font-bold text-emerald-600 tracking-wider">
              {successData.ticketCode}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleNewRequest}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-200 transition-all duration-200"
            >
              แจ้งซ่อมรายการใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[#5D3A29]">
              แบบฟอร์มแจ้งซ่อม
            </h1>
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="text-sm">กรุณากรอกข้อมูลให้ครบถ้วน</span>
              <Pencil className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Reporter Info */}
          <section>
            {/* Section Badge */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 bg-[#5D3A29] text-white text-sm font-medium rounded-full">
                ข้อมูลผู้แจ้ง
              </span>
            </div>

            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  ชื่อผู้แจ้ง<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="ระบุชื่อผู้แจ้ง"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all"
                  />
                </div>
              </div>

              {/* Department Field */}
              <div>
                <label
                  htmlFor="dept"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  แผนก/ฝ่าย<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="dept"
                    value={formData.dept}
                    onChange={handleChange}
                    required
                    placeholder="ระบุแผนก/ฝ่าย"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  เบอร์โทรติดต่อ<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0XX-XXX-XXXX"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Repair Details */}
          <section>
            {/* Section Badge */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 bg-[#5D3A29] text-white text-sm font-medium rounded-full">
                รายละเอียดการแจ้งซ่อม
              </span>
            </div>

            <div className="space-y-4">
              {/* Issue Type Field */}
              <div>
                <label
                  htmlFor="issueType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  ปัญหาที่พบ<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    required
                    placeholder="เช่น คอมพิวเตอร์ค้าง ปริ้นเตอร์เปิดไม่ติด"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all"
                  />
                </div>
              </div>

              {/* Location Field */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  สถานที่ (ให้ไปซ่อมที่ไหน)
                </label>
                <div className="relative">
                  <MapPinHouse className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="ระบุอาคาร , ชั้น , ห้อง"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-0 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all"
                  />
                </div>
              </div>

              {/* Details Field */}
              <div>
                <label
                  htmlFor="details"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  รายละเอียดเพิ่มเติม
                </label>
                <div className="relative">
                  <CirclePlus className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    id="details"
                    rows={4}
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="อธิบายอาการเสียหรือปัญหาที่พบเพิ่มเติม............"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-0 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ระดับความเร่งด่วน
                </label>
                <div className="relative">
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  <select
                    id="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full pl-6 pr-10 py-3.5 bg-gray-200/80 border-0 rounded-2xl text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5D3A29] transition-all cursor-pointer"
                  >
                    {URGENCY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  รูปภาพประกอบ{" "}
                  <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                </label>
                {filePreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all"
                      aria-label="ลบรูปภาพ"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl bg-white hover:bg-gray-50 cursor-pointer transition-all">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      คลิกเพื่อแนบรูปภาพ
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4 pb-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 !bg-[#5D3A29] hover:!bg-[#4A2E21] disabled:bg-gray-300 disabled:cursor-not-allowed !text-white rounded-full font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin text-white" />
              ) : (
                "ส่งแบบฟอร์มแจ้งซ่อม"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RepairFormContent />
    </Suspense>
  );
}
