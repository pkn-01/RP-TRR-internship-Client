"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Button from "@/components/Button";

export default function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasCalled = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasCalled.current) {
        return;
      }
      hasCalled.current = true;

      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code) {
          setError("ไม่พบรหัสยืนยันจาก LINE กรุณาลองเข้าสู่ระบบอีกครั้ง");
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/auth/line-callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "การยืนยันตัวตนกับ LINE ล้มเหลว",
          );
        }

        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("role", data.role || "USER");
          localStorage.setItem("userId", data.userId || "");

          const userRole = (data.role || "USER").toUpperCase();

          if (userRole === "ADMIN") {
            router.replace("/admin");
          } else if (userRole === "IT") {
            router.replace("/it/dashboard");
          } else {
            router.replace("/repairs/liff");
          }
        } else {
          throw new Error("ไม่ได้รับ Token จากระบบ");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการยืนยันตัวตน";
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto animate-spin mb-4" />
          <p className="text-slate-600 font-medium">กำลังเข้าสู่ระบบ...</p>
          <p className="text-slate-400 text-sm mt-1">รอสักครู่</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            เข้าสู่ระบบไม่สำเร็จ
          </h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <Button
            onClick={() => router.push("/login/admin")}
            fullWidth
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าล็อกอิน
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
