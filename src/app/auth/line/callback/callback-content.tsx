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

  // Force Link State
  const [cachedLineUserId, setCachedLineUserId] = useState<string | null>(null);
  const [cachedVerificationToken, setCachedVerificationToken] = useState<
    string | null
  >(null);
  const [showForceLink, setShowForceLink] = useState(false);

  // Function to handle Force Link (Retry with force: true)
  const handleForceLink = async () => {
    console.log(
      "[Force Link] Clicked! cachedLineUserId:",
      cachedLineUserId,
      "cachedVerificationToken:",
      cachedVerificationToken,
    );
    if (!cachedLineUserId || !cachedVerificationToken) {
      console.error("[Force Link] Missing cached values, cannot proceed");
      setError("ข้อมูลไม่สมบูรณ์ กรุณาเริ่มต้นใหม่");
      return;
    }

    setStatusMessage("กำลังย้ายบัญชี LINE...");
    setError("");
    setShowForceLink(false);
    setIsLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");

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
          lineUserId: cachedLineUserId,
          verificationToken: cachedVerificationToken,
          force: true, // Force Link!
        }),
      });

      if (!linkRes.ok) {
        const errData = await linkRes.json();
        throw new Error(errData.message || "การเชื่อมต่อล้มเหลว");
      }

      setSuccess("ย้ายบัญชีสำเร็จ! เชื่อมต่อกับผู้ใช้นี้เรียบร้อยแล้ว");
      setIsLoading(false);

      setTimeout(() => {
        const role = localStorage.getItem("role")?.toLowerCase();
        if (role === "admin") router.push("/admin/profile");
        else if (role === "it") router.push("/it/profile");
        else router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการย้ายบัญชี");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      if (hasCalled.current) return;
      hasCalled.current = true;

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const token = searchParams.get("token");

      // CASE 1: Account Linking Initiation (Token exists, no Code)
      if (token && !code) {
        setStatusMessage("กำลังเชื่อมต่อกับ LINE...");
        try {
          const res = await fetch("/api/auth/line-auth-url");
          if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลการล็อกอิน LINE ได้");
          const data = await res.json();
          const authUrl = new URL(data.auth_url);
          authUrl.searchParams.set("state", `linking:${token}`);
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
          setCachedVerificationToken(verificationToken);
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
            console.log("[Callback] Got lineUserId:", lineUserId);
            setCachedLineUserId(lineUserId);

            // 2. Verify Link in Backend
            const userId = localStorage.getItem("userId");
            const userToken =
              localStorage.getItem("token") ||
              localStorage.getItem("access_token");

            if (!userId || !userToken)
              throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

            const linkRes = await fetch("/api/line-oa/linking/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
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
                setShowForceLink(true); // Enable Force Link UI
              } else if (msg.includes("expired")) {
                msg = "ลิงก์หมดอายุ กรุณาทำรายการใหม่";
              }

              throw new Error(msg);
            }

            setSuccess("เชื่อมต่อบัญชี LINE สำเร็จ!");
            setIsLoading(false);

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

        // Sub-case 2b: Normal Login
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
            localStorage.setItem("token", data.access_token);
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

          {showForceLink ? (
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleForceLink}
                fullWidth
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ยืนยันการย้ายบัญชีมาที่นี่
              </Button>
              <Button
                onClick={() => router.push("/login/admin")}
                fullWidth
                variant="secondary"
                className="border-slate-200"
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => router.push("/login/admin")}
              fullWidth
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
