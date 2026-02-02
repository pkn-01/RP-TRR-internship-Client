"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

      setSuccessMessage("เข้าสู่ระบบสำเร็จ...");
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
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/image/TRRPR.png"
          alt="IT REPAIR SERVICES TRR"
          width={180}
          height={180}
          className="mx-auto"
        />
      </div>

      {/* Form Container */}
      <div className="w-full max-w-[400px] px-4">
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
          {/* Email Input */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pl-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมล"
                className="w-full border-b border-gray-300 py-3 pl-10 pr-4 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-[#6F5246] transition-colors bg-transparent"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pr-2">
                •••
              </div>
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pl-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full border-b border-gray-300 py-3 pl-10 pr-4 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-[#6F5246] transition-colors bg-transparent"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pr-2">
                •••
              </div>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mb-8">
            <Link
              href="#"
              className="text-gray-500 hover:text-[#6F5246] text-sm transition-colors"
            >
              ลืมรหัส
            </Link>
          </div>

          {/* Login Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full max-w-[280px] bg-[#6F5246] text-white text-lg py-3 rounded-full hover:bg-[#5a4238] transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-sm mt-16">
        © 2026 Creat By Internship ku csc 
      </p>
    </div>
  );
}
