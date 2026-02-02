"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import Button from "@/components/Button";

export default function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("กำลังตรวจสอบข้อมูล...");
  const hasCalled = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasCalled.current) return;
      hasCalled.current = true;

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const token = searchParams.get("token"); // Verification Token for Linking

      // CASE 1: Account Linking Initiation (Token exists, no Code)
      if (token && !code) {
        setStatusMessage("กำลังเชื่อมต่อกับ LINE...");
        try {
          // Get LINE Auth URL from Backend
          const res = await fetch("/api/auth/line-auth-url");
          if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลการล็อกอิน LINE ได้");
          const data = await res.json();

          // Inject our linking token into the state
          const authUrl = new URL(data.auth_url);
          // Format: linking:<verificationToken>
          authUrl.searchParams.set("state", `linking:${token}`);

          // Redirect to LINE Login
          window.location.href = authUrl.toString();
        } catch (err) {
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
          setIsLoading(false);
        }
        return;
      }

      // CASE 2: Returning from LINE Login (Code exists)
      if (code) {
        // Sub-case 2a: Account Linking Return (State starts with linking:)
        if (state && state.startsWith("linking:")) {
          const verificationToken = state.split(":")[1];
          setStatusMessage("กำลังยืนยันการเชื่อมต่อบัญชี...");

          try {
            // 1. Get LINE User ID from Code
            const verifyRes = await fetch("/api/auth/verify-line-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });

            if (!verifyRes.ok) throw new Error("การแจ้งยืนยันตัวตนล้มเหลว");
            const { lineUserId } = await verifyRes.json();

            // 2. Verify Link in Backend
            const userId = localStorage.getItem("userId");
            const token =
              localStorage.getItem("token") ||
              localStorage.getItem("access_token");

            if (!userId || !token)
              throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

            const linkRes = await fetch("/api/line-oa/linking/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId: parseInt(userId),
                lineUserId,
                verificationToken,
              }),
            });

            if (!linkRes.ok) {
              const errData = await linkRes.json();
              let msg = errData.message || "การเชื่อมต่อล้มเหลว";

              if (msg.includes("already linked")) {
                msg = "บัญชี LINE นี้ถูกเชื่อมต่อกับผู้ใช้อื่นแล้ว";
              } else if (msg.includes("expired")) {
                msg = "ลิงก์หมดอายุ กรุณาทำรายการใหม่";
              }

              throw new Error(msg);
            }

            setSuccess("เชื่อมต่อบัญชี LINE สำเร็จ!");
            setIsLoading(false);

            // Redirect back to profile after 2 seconds
            setTimeout(() => {
              const role = localStorage.getItem("role")?.toLowerCase();
              if (role === "admin") router.push("/admin/profile");
              else if (role === "it") router.push("/it/profile");
              else router.push("/");
            }, 2000);
          } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
            setIsLoading(false);
          }
          return;
        }

        // Sub-case 2b: Normal Login (Existing Logic)
        setStatusMessage("กำลังเข้าสู่ระบบ...");
        try {
          const response = await fetch("/api/auth/line-callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "การยืนยันตัวตนล้มเหลว");
          }

          const data = await response.json();

          if (data.access_token) {
            localStorage.setItem("token", data.access_token); // Use 'token' consistent with app
            localStorage.setItem("userId", data.userId || "");
            localStorage.setItem("role", data.role || "USER");

            const userRole = (data.role || "USER").toUpperCase();
            if (userRole === "ADMIN") router.replace("/admin");
            else if (userRole === "IT") router.replace("/it/dashboard");
            else router.replace("/repairs/liff");
          } else {
            throw new Error("ไม่ได้รับ Token จากระบบ");
          }
        } catch (err: any) {
          setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
          <p className="text-slate-600 font-medium">{statusMessage}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">สำเร็จ!</h1>
          <p className="text-slate-600 mb-6">{success}</p>
          <p className="text-sm text-slate-400">กำลังพาคุณกลับ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <Button
            onClick={() => router.push("/login/admin")}
            fullWidth
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
