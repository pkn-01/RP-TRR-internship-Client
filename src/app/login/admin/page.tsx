"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Alert from "@/components/Alert";
import { AuthService } from "@/lib/authService";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await AuthService.login({ email, password });
      console.log("Login response:", response);
      const userRole = response.role || localStorage.getItem("role") || "USER";
      console.log("User role:", userRole);

      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => {
        // Redirect based on role
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "IT") {
          router.push("/it/dashboard");
        } else {
          router.push("/tickets");
        }
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        <Card>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              เข้าสู่ระบบแอดมิน
            </h1>
            <p className="text-gray-600">ใช้อีเมลและรหัสผ่านของคุณ</p>
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
          <form onSubmit={handleLogin} className="space-y-5">
            <InputField
              label="อีเมล"
              type="email"
              placeholder=""
              value={email}
              onChange={setEmail}
              error={errors.email}
              required
            />

            <InputField
              label="รหัสผ่าน"
              type="password"
              placeholder=""
              value={password}
              onChange={setPassword}
              error={errors.password}
              required
            />

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">จำฉันไว้</span>
              </label>
              <Link
                href="#"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              เข้าสู่ระบบ
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 Creat By Internship Project TRR .
        </p>
      </div>
    </div>
  );
}
