"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Laptop,
  Info,
  ChevronRight,
  Zap,
  HelpCircle,
} from "lucide-react";
import SelectField from "@/components/SelectField";
import FileUpload from "@/components/FileUpload";
import InputField from "@/components/InputField";
import { apiFetch } from "@/services/api";
import { uploadData } from "@/services/uploadService";

// Problem Categories with Subcategories - Must match Prisma ProblemCategory enum
const PROBLEM_CATEGORIES = [
  { value: "NETWORK", label: "เครือข่าย" },
  { value: "HARDWARE", label: "ฮาร์ดแวร์" },
  { value: "SOFTWARE", label: "ซอฟต์แวร์" },
  { value: "PERIPHERAL", label: "เครื่องปริ้นเตอร์/อุปกรณ์ต่อพ่วง" },
  { value: "OTHER", label: "อื่นๆ (ปรับอากาศ, ไฟฟ้า, ฯลฯ)" },
];

const SUBCATEGORIES: {
  [key: string]: Array<{ value: string; label: string }>;
} = {
  NETWORK: [
    { value: "INTERNET_DOWN", label: "อินเทอร์เน็ตขาด" },
    { value: "SLOW_CONNECTION", label: "การเชื่อมต่อช้า" },
    { value: "WIFI_ISSUE", label: "ปัญหา WiFi" },
  ],
  HARDWARE: [
    { value: "MONITOR_BROKEN", label: "จอมอนิเตอร์เสีย" },
    { value: "KEYBOARD_BROKEN", label: "แป้นพิมพ์เสีย" },
    { value: "MOUSE_BROKEN", label: "เมาส์เสีย" },
    { value: "COMPUTER_CRASH", label: "คอมพิวเตอร์ค้าง" },
  ],
  SOFTWARE: [
    { value: "INSTALLATION", label: "ติดตั้งซอฟต์แวร์" },
    { value: "LICENSE", label: "ปัญหาลิขสิทธิ์" },
    { value: "PERFORMANCE", label: "ปัญหาประสิทธิภาพ" },
  ],
  PERIPHERAL: [
    { value: "JAM", label: "กระดาษค้าง (ปริ้นเตอร์)" },
    { value: "NO_PRINTING", label: "ไม่สามารถพิมพ์ได้" },
    { value: "CARTRIDGE", label: "ปัญหาตลับหมึก" },
    { value: "OTHER", label: "อุปกรณ์ต่อพ่วงอื่นๆ" },
  ],
  OTHER: [
    { value: "INSTALLATION_AC", label: "ติดตั้งแอร์" },
    { value: "MALFUNCTION_AC", label: "แอร์ขัดข้อง" },
    { value: "POWER_DOWN", label: "ไฟฟ้าดับ" },
    { value: "LIGHT_PROBLEM", label: "ปัญหาแสงสว่าง" },
    { value: "OTHER", label: "อื่นๆ" },
  ],
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "ต่ำ" },
  { value: "MEDIUM", label: "ปานกลาง" },
  { value: "HIGH", label: "ด่วน" },
];

export default function CreateRepairRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    problemCategory: "",
    problemSubcategory: "",
    equipmentName: "",
    location: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    // Guest information
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestDepartment: "",
  });

  const totalSteps = 5;

  useEffect(() => {
    // No authentication check needed - allow guests
  }, []);

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      problemCategory: value,
      problemSubcategory: "",
    });
    setErrors({ ...errors, problemCategory: "" });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.problemCategory)
      newErrors.problemCategory = "กรุณาเลือกประเภทหลัก";
    if (!formData.problemSubcategory)
      newErrors.problemSubcategory = "กรุณาเลือกประเภทย่อย";
    if (!formData.equipmentName.trim())
      newErrors.equipmentName = "กรุณากรอกชื่ออุปกรณ์";
    if (!formData.location.trim()) newErrors.location = "กรุณากรอกสถานที่";
    if (!formData.title.trim()) newErrors.title = "กรุณากรอกหัวเรื่อง";
    if (!formData.description.trim())
      newErrors.description = "กรุณากรอกรายละเอียด";

    // Guest information required if not authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      if (!formData.guestName.trim()) newErrors.guestName = "กรุณากรอกชื่อ";
      if (!formData.guestEmail.trim()) newErrors.guestEmail = "กรุณากรอกอีเมล";
      if (!formData.guestPhone.trim())
        newErrors.guestPhone = "กรุณากรอกเบอร์โทรศัพท์";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const dataPayload = {
        title: formData.title,
        description: formData.description,
        category: "REPAIR",
        priority: formData.priority,
        problemCategory: formData.problemCategory,
        problemSubcategory: formData.problemSubcategory,
        equipmentName: formData.equipmentName,
        location: formData.location,
        guestName: !token ? formData.guestName : undefined,
        guestEmail: !token ? formData.guestEmail : undefined,
        guestPhone: !token ? formData.guestPhone : undefined,
        guestDepartment:
          !token && formData.guestDepartment
            ? formData.guestDepartment
            : undefined,
      };

      const result = await uploadData("/api/tickets", dataPayload, files);

      // Show success message with ticket code
      alert(`สำเร็จ! รหัสแจ้งซ่อมของคุณคือ: ${result.ticketCode}`);
      router.push(`/tickets/${result.id}`);
    } catch (error: any) {
      alert(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const availableSubcategories = SUBCATEGORIES[formData.problemCategory] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all duration-300 mb-8 group hover:gap-3 px-8 pt-8"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-medium">ย้อนกลับ</span>
        </button>

        <div className="bg-white rounded-none shadow-2xl overflow-hidden border border-slate-100">
          {/* Enhanced Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-8 py-12 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/20 rounded-lg">
                  <Zap size={20} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  แจ้งซ่อมอุปกรณ์
                </h1>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed">
                กรุณากรอกข้อมูลให้ครบถ้วนและชัดเจน
                เพื่อให้เจ้าหน้าที่สามารถดำเนินการได้อย่างรวดเร็วและแม่นยำ
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="px-12 py-6 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-md"
                          : isActive
                            ? "bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-lg"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : step}
                    </div>
                    {step < totalSteps && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${
                          isCompleted ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-3">
              <span>ประเภท</span>
              <span>อุปกรณ์</span>
              <span>อาการ</span>
              <span>ข้อมูล</span>
              <span>ไฟล์</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-12 space-y-10">
            {/* Step 1: Classification */}
            <div
              className={`space-y-6 transition-all duration-300 ${
                currentStep !== 1 && "opacity-50 pointer-events-none"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-lg mt-1">
                  <Info size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    ข้อมูลประเภทปัญหา
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    เลือกประเภทที่สัมพันธ์กับปัญหาของอุปกรณ์ของคุณ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-11">
                <div>
                  <SelectField
                    label="ประเภทหลัก"
                    value={formData.problemCategory}
                    onChange={handleCategoryChange}
                    options={PROBLEM_CATEGORIES}
                    required
                  />
                  {errors.problemCategory && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.problemCategory}
                    </p>
                  )}
                </div>
                <div>
                  <SelectField
                    label="ประเภทย่อย"
                    value={formData.problemSubcategory}
                    onChange={(v) => {
                      setFormData({ ...formData, problemSubcategory: v });
                      setErrors({ ...errors, problemSubcategory: "" });
                    }}
                    options={availableSubcategories}
                    disabled={!formData.problemCategory}
                    required
                  />
                  {errors.problemSubcategory && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.problemSubcategory}
                    </p>
                  )}
                </div>
              </div>

              {currentStep === 1 && (
                <div className="flex justify-end pt-4 pl-11">
                  <button
                    type="button"
                    onClick={() =>
                      formData.problemCategory &&
                      formData.problemSubcategory &&
                      setCurrentStep(2)
                    }
                    disabled={
                      !formData.problemCategory || !formData.problemSubcategory
                    }
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all duration-200 font-medium text-sm"
                  >
                    ถัดไป <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Equipment Detail */}
            <div
              className={`space-y-6 transition-all duration-300 ${
                currentStep !== 2 && "opacity-50 pointer-events-none"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg mt-1">
                  <Laptop size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    รายละเอียดอุปกรณ์และสถานที่
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    ระบุอุปกรณ์ที่เสีย และสถานที่ตั้งอุปกรณ์
                  </p>
                </div>
              </div>

              <div className="space-y-5 pl-11">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <InputField
                      label="ชื่ออุปกรณ์ / รหัสครุภัณฑ์"
                      value={formData.equipmentName}
                      onChange={(v) => {
                        setFormData({ ...formData, equipmentName: v });
                        setErrors({ ...errors, equipmentName: "" });
                      }}
                      placeholder="เช่น PC-Dept-01, HP LaserJet Pro"
                      required
                    />
                    {errors.equipmentName && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.equipmentName}
                      </p>
                    )}
                  </div>
                  <div>
                    <InputField
                      label="สถานที่ / ห้อง"
                      value={formData.location}
                      onChange={(v) => {
                        setFormData({ ...formData, location: v });
                        setErrors({ ...errors, location: "" });
                      }}
                      placeholder="เช่น ชั้น 3 ห้องบัญชี หรือ ห้องประชุมหลัก"
                      required
                    />
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.location}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm font-semibold text-slate-700">
                      ระดับความเร่งด่วน
                    </label>
                    <div className="group relative">
                      <HelpCircle
                        size={16}
                        className="text-slate-400 cursor-help"
                      />
                      <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg p-2 z-10">
                        ต่ำ: ไม่มีความเร่งด่วน | ปานกลาง: ปกติ | ด่วน:
                        ส่งผลกระทบต่อการทำงาน
                      </div>
                    </div>
                  </div>
                  <SelectField
                    label=""
                    value={formData.priority}
                    onChange={(v) => setFormData({ ...formData, priority: v })}
                    options={PRIORITY_OPTIONS}
                  />
                </div>
              </div>

              {currentStep === 2 && (
                <div className="flex justify-between pt-4 pl-11">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      formData.equipmentName &&
                      formData.location &&
                      setCurrentStep(3)
                    }
                    disabled={!formData.equipmentName || !formData.location}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all font-medium text-sm"
                  >
                    ถัดไป <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Problem Description */}
            <div
              className={`space-y-6 transition-all duration-300 ${
                currentStep !== 3 && "opacity-50 pointer-events-none"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-orange-100 rounded-lg mt-1">
                  <AlertCircle size={18} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    อาการที่พบ
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    อธิบายอาการเสีย และรายละเอียดเพิ่มเติมให้ชัดเจน
                  </p>
                </div>
              </div>

              <div className="space-y-5 pl-11">
                <div>
                  <InputField
                    label="หัวเรื่อง"
                    value={formData.title}
                    onChange={(v) => {
                      setFormData({ ...formData, title: v });
                      setErrors({ ...errors, title: "" });
                    }}
                    placeholder="สรุปปัญหาสั้นๆ เช่น 'เปิดเครื่องไม่ติด', 'จอหญิงลาย'"
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2 italic">
                    รายละเอียดเพิ่มเติม <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      setErrors({ ...errors, description: "" });
                    }}
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder-slate-400 resize-none"
                    placeholder="อธิบายอาการเสียอย่างละเอียด เช่น เมื่อไหร่เสีย, เหตุการณ์ที่เกิดขึ้น, ลองแก้ไขอะไรบ้าง..."
                    required
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {formData.description.length} / 500 ตัวอักษร
                  </p>
                </div>
              </div>

              {currentStep === 3 && (
                <div className="flex justify-between pt-4 pl-11">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      // Skip guest info if logged in
                      setCurrentStep(token ? 5 : 4);
                    }}
                    disabled={!formData.title || !formData.description}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all font-medium text-sm"
                  >
                    ถัดไป <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 4: Guest Information (if not authenticated) */}
            <div
              className={`space-y-6 transition-all duration-300 ${
                currentStep !== 4 && "opacity-50 pointer-events-none"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-cyan-100 rounded-lg mt-1">
                  <Info size={18} className="text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    ข้อมูลของท่าน
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    กรุณากรอกข้อมูลการติดต่อของท่านเพื่อให้เราสามารถติดต่อกลับได้
                  </p>
                </div>
              </div>

              <div className="space-y-5 pl-11">
                <div>
                  <InputField
                    label="ชื่อ"
                    value={formData.guestName}
                    onChange={(v) => {
                      setFormData({ ...formData, guestName: v });
                      setErrors({ ...errors, guestName: "" });
                    }}
                    placeholder="กรุณากรอกชื่อของท่าน"
                    required
                  />
                  {errors.guestName && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.guestName}
                    </p>
                  )}
                </div>

                <div>
                  <InputField
                    label="อีเมล"
                    type="email"
                    value={formData.guestEmail}
                    onChange={(v) => {
                      setFormData({ ...formData, guestEmail: v });
                      setErrors({ ...errors, guestEmail: "" });
                    }}
                    placeholder="example@email.com"
                    required
                  />
                  {errors.guestEmail && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.guestEmail}
                    </p>
                  )}
                </div>

                <div>
                  <InputField
                    label="เบอร์โทรศัพท์"
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(v) => {
                      setFormData({ ...formData, guestPhone: v });
                      setErrors({ ...errors, guestPhone: "" });
                    }}
                    placeholder="เช่น 081-2345678"
                    required
                  />
                  {errors.guestPhone && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.guestPhone}
                    </p>
                  )}
                </div>

                <div>
                  <InputField
                    label="แผนก (ไม่บังคับ)"
                    value={formData.guestDepartment}
                    onChange={(v) => {
                      setFormData({ ...formData, guestDepartment: v });
                    }}
                    placeholder="เช่น IT, HR, Finance"
                  />
                </div>
              </div>

              {currentStep === 4 && (
                <div className="flex justify-between pt-4 pl-11">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      formData.guestName &&
                      formData.guestEmail &&
                      formData.guestPhone &&
                      setCurrentStep(5)
                    }
                    disabled={
                      !formData.guestName ||
                      !formData.guestEmail ||
                      !formData.guestPhone
                    }
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all font-medium text-sm"
                  >
                    ถัดไป <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 5: Attachments */}
            <div
              className={`space-y-6 transition-all duration-300 ${
                currentStep !== 5 && "opacity-50 pointer-events-none"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-100 rounded-lg mt-1">
                  <Paperclip size={18} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    หลักฐานภาพถ่าย
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    อัพโหลดภาพถ่ายเพื่อแสดงอาการเสีย (ไม่บังคับ)
                  </p>
                </div>
              </div>

              <div className="pl-11 bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 transition-all duration-300">
                <FileUpload
                  label="อัพโหลดภาพถ่าย"
                  onChange={setFiles}
                  multiple
                  maxSize={10}
                />
                {files.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      ไฟล์ที่เลือก ({files.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="bg-white px-4 py-3 rounded-lg border border-purple-200 text-xs text-slate-600 flex items-center gap-2 shadow-sm hover:shadow-md hover:border-purple-400 transition-all"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500 flex-shrink-0"
                          />
                          <span
                            className="truncate max-w-[200px]"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className="text-slate-400 flex-shrink-0">
                            {(file.size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 pl-11">
                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    setCurrentStep(token ? 3 : 4);
                  }}
                  className="flex-1 px-8 py-3.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังส่ง...</span>
                    </>
                  ) : (
                    <>
                      <Send
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                      <span>ส่งข้อมูลการแจ้งซ่อม</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Footer */}
        <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <HelpCircle
              size={18}
              className="text-indigo-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-2">
                ต้องการความช่วยเหลือ?
              </p>
              <p className="text-sm text-slate-600">
                กรุณาให้รายละเอียดให้มากที่สุด
                เพื่อให้เจ้าหน้าที่สามารถจัดการเรื่องของคุณได้อย่างมีประสิทธิภาพ
                หากมีคำถาม{" "}
                <a
                  href="mailto:support@company.com"
                  className="text-indigo-600 hover:underline"
                >
                  ติดต่อเราได้
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4 shadow-lg" />
        <p className="text-slate-600 font-semibold tracking-wide">
          กำลังเตรียมข้อมูล...
        </p>
        <p className="text-slate-400 text-sm mt-2">โปรดรอสักครู่</p>
      </div>
    </div>
  );
}
