"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { apiFetch } from "@/services/api";
import { uploadData } from "@/services/uploadService";

const PROBLEM_CATEGORIES = [
  { value: "HARDWARE", label: "💻 Hardware (คอมพิวเตอร์, อุปกรณ์)" },
  { value: "SOFTWARE", label: "📱 Software (โปรแกรม, ระบบ)" },
  { value: "NETWORK", label: "🌐 Network (อินเทอร์เน็ต, Wi-Fi)" },
  { value: "PERIPHERAL", label: "🖥️ Peripheral (เมาส์, คีย์บอร์ด, จอภาพ)" },
  { value: "EMAIL_OFFICE365", label: "📧 Email/Office 365" },
  { value: "ACCOUNT_PASSWORD", label: "🔐 Account/Password" },
  { value: "OTHER", label: "🔧 อื่นๆ" },
];

const URGENCY_LEVELS = [
  { value: "NORMAL", label: "🟢 ปกติ (สามารถทำงานได้ต่อ)", emoji: "🟢" },
  {
    value: "URGENT",
    label: "🟡 ด่วน (ส่งผลต่อการทำงาน)",
    emoji: "🟡",
  },
  {
    value: "CRITICAL",
    label: "🔴 ด่วนมาก (หยุดงานทันที)",
    emoji: "🔴",
  },
];

interface SuccessState {
  show: boolean;
  ticketCode?: string;
}

interface FormData {
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  reporterLineId?: string;
  problemCategory: string;
  problemTitle: string;
  problemDescription: string;
  location: string;
  urgency: string;
}

function RepairPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lineUserId, setLineUserId] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    reporterName: "",
    reporterDepartment: "",
    reporterPhone: "",
    reporterLineId: "",
    problemCategory: "HARDWARE",
    problemTitle: "",
    problemDescription: "",
    location: "",
    urgency: "NORMAL",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessState>({ show: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // ดึง lineUserId จาก URL params (ถ้ามี)
    const id = searchParams.get("lineUserId") || "";
    setLineUserId(id);

    // ตั้งค่า reporterLineId ด้วย
    if (id) {
      setFormData((prev) => ({
        ...prev,
        reporterLineId: id,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        const remainingSlots = 3 - files.length;
        const filesToProcess = Math.min(selectedFiles.length, remainingSlots);

        for (let i = 0; i < filesToProcess; i++) {
          const file = selectedFiles[i];
          newFiles.push(file);
          // Use object URL for faster preview
          const url = URL.createObjectURL(file);
          newPreviews.push(url);
        }

        setFiles((prev) => [...prev, ...newFiles]);
        setFilePreviews((prev) => [...prev, ...newPreviews]);
      }
    },
    [files.length],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    setFilePreviews((prev) => {
      const newPreviews = [...prev];
      const removedUrl = newPreviews.splice(index, 1)[0];
      if (removedUrl) URL.revokeObjectURL(removedUrl);
      return newPreviews;
    });
  }, []);

  // Clean up all object URLs when component unmounts
  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reporterName.trim()) {
      newErrors.reporterName = "กรุณากรอกชื่อเล่น";
    }
    if (!formData.reporterDepartment.trim()) {
      newErrors.reporterDepartment = "กรุณาเลือกแผนก";
    }
    if (!formData.problemCategory) {
      newErrors.problemCategory = "กรุณาเลือกประเภทปัญหา";
    }
    if (!formData.problemTitle.trim()) {
      newErrors.problemTitle = "กรุณากรอกปัญหาที่พบ";
    }
    if (formData.problemTitle.length < 10) {
      newErrors.problemTitle = "ปัญหาต้องมีความยาวอย่างน้อย 10 ตัวอักษร";
    }
    if (!formData.location.trim()) {
      newErrors.location = "กรุณากรอกสถานที่";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare payload object for uploadData
      const dataPayload = {
        reporterName: formData.reporterName,
        reporterDepartment: formData.reporterDepartment,
        reporterPhone: formData.reporterPhone || "-",
        reporterLineId:
          formData.reporterLineId || (lineUserId ? lineUserId : undefined),
        problemCategory: formData.problemCategory,
        problemTitle: formData.problemTitle,
        problemDescription: formData.problemDescription,
        location: formData.location,
        urgency: formData.urgency,
      };

      // Use LIFF endpoint if lineUserId is present, otherwise use protected endpoint
      const endpoint = lineUserId ? "/api/repairs/liff/create" : "/api/repairs";

      const data = await uploadData(endpoint, dataPayload, files);

      setSuccess({ show: true, ticketCode: data.ticketCode });

      setSuccess({ show: true, ticketCode: data.ticketCode });
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่ง",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success.show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-8 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100 dark:border-slate-700">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
            แจ้งซ่อมสำเร็จ!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            เราได้รับข้อมูลของคุณเรียบร้อยแล้ว <br />
            ทีมงานจะดำเนินการตรวจสอบโดยเร็วที่สุด
          </p>

          <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl mb-6 border border-gray-200 dark:border-slate-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide font-semibold">
              เลขที่รายการ (Ticket ID)
            </p>
            <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
              {success.ticketCode}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              💡 คุณสามารถตรวจสอบสถานะได้ทันทีโดยกดปุ่ม <br />
              <span className="font-semibold">"📋 ตรวจสอบสถานะ"</span> ใน LINE
              Menu
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all duration-200"
            >
              กลับหน้าหลัก
            </button>
            <button
              onClick={() => (window.location.href = "line://nv/notification")}
              className="w-full bg-white dark:bg-slate-700 text-gray-700 dark:text-white py-3 rounded-xl font-medium border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
            >
              ปิดหน้านี้
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 py-8 md:py-12 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-slate-800">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4 text-blue-600 dark:text-blue-400">
              <Upload className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              แจ้งซ่อมอุปกรณ์ IT
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
              กรอกข้อมูลด้านล่างเพื่อให้ทีมงาน IT ช่วยเหลือคุณ{" "}
              <br className="hidden md:block" />
              เราพร้อมดูแลทุกปัญหาการใช้งาน
            </p>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  เกิดข้อผิดพลาดในการส่งข้อมูล
                </h3>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                  {errors.submit}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ชื่อเล่น */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  ชื่อเล่นผู้แจ้ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleInputChange}
                  placeholder="เช่น ปอนด์, แนน"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
                {errors.reporterName && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.reporterName}
                  </p>
                )}
              </div>

              {/* แผนก */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  แผนก <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="reporterDepartment"
                    value={formData.reporterDepartment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition duration-200"
                  >
                    <option value="" disabled className="text-gray-400">
                      -- เลือกแผนก --
                    </option>
                    <option value="ฝ่ายบัญชี">ฝ่ายบัญชี</option>
                    <option value="ฝ่ายขาย">ฝ่ายขาย</option>
                    <option value="ฝ่ายผลิต">ฝ่ายผลิต</option>
                    <option value="ฝ่ายบริหาร">ฝ่ายบริหาร</option>
                    <option value="ฝ่ายบุคคล">ฝ่ายบุคคล</option>
                    <option value="ฝ่าย IT">ฝ่าย IT</option>
                  </select>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                {errors.reporterDepartment && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.reporterDepartment}
                  </p>
                )}
              </div>
            </div>

            {/* เบอร์โทร */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                เบอร์โทรศัพท์ติดต่อ (ไม่บังคับ)
              </label>
              <input
                type="tel"
                name="reporterPhone"
                value={formData.reporterPhone}
                onChange={handleInputChange}
                placeholder="0xx-xxx-xxxx"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>

            <div className="h-px bg-gray-200 dark:bg-slate-700 my-6" />

            {/* ประเภทปัญหา */}
            <div className="space-y-3">
              <label className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                เลือกประเภทปัญหา <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PROBLEM_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className={`
                      relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200
                      ${
                        formData.problemCategory === category.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 dark:border-blue-500"
                          : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transform hover:scale-[1.01]"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="problemCategory"
                      value={category.value}
                      checked={formData.problemCategory === category.value}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600"
                    />
                    <span
                      className={`ml-3 font-medium ${
                        formData.problemCategory === category.value
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {category.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.problemCategory && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.problemCategory}
                </p>
              )}
            </div>

            {/* ปัญหาที่พบ */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                หัวข้อปัญหา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="problemTitle"
                value={formData.problemTitle}
                onChange={handleInputChange}
                placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด, จอภาพดับ"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
              <div className="flex justify-between items-center text-xs">
                {errors.problemTitle ? (
                  <p className="text-red-500 font-medium">
                    {errors.problemTitle}
                  </p>
                ) : (
                  <span></span>
                )}
                <span className="text-gray-500 dark:text-gray-400">
                  {formData.problemTitle.length}/100
                </span>
              </div>
            </div>

            {/* สถานที่ */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                สถานที่/ห้องทำงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="ระบุตึก ชั้น หรือเลขห้องให้ชัดเจน"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
              {errors.location && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.location}
                </p>
              )}
            </div>

            {/* รายละเอียด */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleInputChange}
                placeholder="อธิบายอาการอย่างละเอียด เพื่อให้ทีมงานวิเคราะห์ปัญหาได้เร็วขึ้น..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
              />
              <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                {formData.problemDescription.length}/500
              </div>
            </div>

            {/* รูปภาพ */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                แนบรูปภาพ (สูงสุด 3 รูป)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 group cursor-pointer">
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-gray-400 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    คลิกเพื่อเลือกรูปภาพ
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    JPG, PNG ขนาดไม่เกิน 5MB ต่อรูป
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={files.length >= 3}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title=""
                />
              </div>

              {/* Preview */}
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {filePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 aspect-square"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors backdrop-blur-sm shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-200 dark:bg-slate-700 my-6" />

            {/* ความเร่งด่วน */}
            <div className="space-y-3">
              <label className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-orange-500 rounded-full inline-block"></span>
                ระดับความเร่งด่วน
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {URGENCY_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className={`
                      relative flex flex-col md:flex-row items-center justify-center md:justify-start p-4 border rounded-xl cursor-pointer transition-all duration-200 gap-3 text-center md:text-left
                      ${
                        formData.urgency === level.value
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-500 dark:border-orange-500"
                          : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transform hover:scale-[1.01]"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level.value}
                      checked={formData.urgency === level.value}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <span className="text-2xl">{level.emoji}</span>
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold ${
                          formData.urgency === level.value
                            ? "text-orange-900 dark:text-orange-100"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {level.label.split(" ")[1]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {level.label.split("(")[1]?.replace(")", "") || "ปกติ"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>กำลังส่งข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <span>ส่งแจ้งซ่อม</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RepairPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <RepairPageContent />
    </Suspense>
  );
}
