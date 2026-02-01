"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Alert from "@/components/Alert";
import FormDivider from "@/components/FormDivider";
import { AuthService } from "@/lib/authService";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  phoneNumber?: string;
  lineId?: string;
}

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    phoneNumber: "",
    lineId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phoneNumber.replace(/\D/g, ""))) {
      newErrors.phoneNumber = "Phone number must be at least 10 digits";
    }

    if (!formData.lineId.trim()) {
      newErrors.lineId = "Line ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the terms and conditions");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await AuthService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        lineId: formData.lineId,
      });

      setSuccessMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/login/admin");
      }, 2000);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = formData.password.length;
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 6) return "bg-red-500";
    if (passwordStrength < 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4 py-12">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              สมัครสมาชิก
            </h1>
            <p className="text-gray-600">สร้างบัญชีใหม่เพื่อเริ่มต้น</p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage("")}
            />
          )}
          {successMessage && <Alert type="success" message={successMessage} />}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <InputField
              label="ชื่อเต็ม"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              error={errors.name}
              required
            />

            <InputField
              label="อีเมล"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              error={errors.email}
              required
            />

            <InputField
              label="แผนก"
              type="text"
              placeholder="เช่น ฝ่าย IT"
              value={formData.department}
              onChange={(value) => handleInputChange("department", value)}
              error={errors.department}
              required
            />

            <InputField
              label="เบอร์โทรศัพท์"
              type="tel"
              placeholder="เช่น 0812345678"
              value={formData.phoneNumber}
              onChange={(value) => handleInputChange("phoneNumber", value)}
              error={errors.phoneNumber}
              required
            />

            <InputField
              label="Line ID"
              type="text"
              placeholder="เช่น user123456"
              value={formData.lineId}
              onChange={(value) => handleInputChange("lineId", value)}
              error={errors.lineId}
              required
            />

            <div>
              <InputField
                label="รหัสผ่าน"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(value) => handleInputChange("password", value)}
                error={errors.password}
                required
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">ความแข็งแรง:</span>
                    <span className="text-xs text-gray-600">
                      {passwordStrength < 6
                        ? "อ่อน"
                        : passwordStrength < 10
                          ? "ปานกลาง"
                          : "แข็งแรง"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                      style={{
                        width: `${Math.min((passwordStrength / 15) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <InputField
              label="ยืนยันรหัสผ่าน"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(value) => handleInputChange("confirmPassword", value)}
              error={errors.confirmPassword}
              required
            />

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 focus:ring-purple-500 mt-1"
              />
              <label className="ml-2 text-sm text-gray-600">
                ฉันยอมรับ{" "}
                <Link
                  href="#"
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  เงื่อนไขการใช้บริการ
                </Link>{" "}
                และ{" "}
                <Link
                  href="#"
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              สมัครสมาชิก
            </Button>
          </form>

          <FormDivider />

          {/* Login link */}
          <div className="text-center">
            <p className="text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/login/admin"
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 Ticket Resolver System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
