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

// Custom Input Component - defined OUTSIDE of AdminLogin to prevent re-creation on each render
const CustomInput = ({ label, type, value, onChange, placeholder }: any) => (
  <div className="mb-6">
    <label className="block text-gray-600 mb-2 font-normal text-lg">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-400 p-2 text-lg focus:outline-none focus:border-gray-600"
    />
  </div>
);

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      {/* Header outside the box */}
      <h1 className="text-4xl text-black mb-8 font-normal">ยินดีต้อนรับ</h1>

      <div className="w-full max-w-[500px] border border-gray-400 p-12 bg-white">
        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4">
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage("")}
            />
          </div>
        )}
        {successMessage && (
          <div className="mb-4">
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col">
          <CustomInput
            label="อีเมล*"
            type="email"
            value={email}
            onChange={setEmail}
          />

          <CustomInput
            label="รหัสผ่าน*"
            type="password"
            value={password}
            onChange={setPassword}
          />

          <div className="flex justify-end mb-8">
            <Link href="#" className="text-gray-600 hover:text-black text-lg">
              ลืมรหัส
            </Link>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: "#6F5246", color: "white" }}
              className="bg-[#6F5246] text-white text-2xl px-12 py-3 hover:bg-[#5a4238] transition-colors duration-200 min-w-[200px]"
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-sm mt-16 italic font-light">
        © 2026 Creat By Internship Project TRR .
      </p>
    </div>
  );
}
