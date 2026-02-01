"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Calendar,
  Settings,
  Wrench,
  AlertTriangle,
  History,
  ArrowLeft,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lineUserId, setLineUserId] = useState<string>(
    searchParams.get("lineUserId") || "",
  );
  const [isInitializing, setIsInitializing] = useState(
    !searchParams.get("lineUserId"),
  );

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LIFF Initialization
  useEffect(() => {
    const initLiff = async () => {
      // If we already have lineUserId from URL, no need to init for ID (but good for consistency)
      if (lineUserId) {
        setIsInitializing(false);
        return;
      }

      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        if (!liffId) {
          setError("System Error: LIFF ID missing");
          return;
        }

        if (!liff.id) {
          // Use a timeout to prevent permanent hang in LINE app
          const initPromise = liff.init({
            liffId,
            withLoginOnExternalBrowser: true,
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("LIFF initialization timeout")),
              10000,
            ),
          );

          await Promise.race([initPromise, timeoutPromise]);
        }

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
      } catch (err: any) {
        console.error("LIFF Init Error:", err);
        setError("ไม่สามารถยืนยันตัวตนกับ LINE ได้");
      } finally {
        setIsInitializing(false);
      }
    };

    initLiff();
  }, []);

  useEffect(() => {
    if (lineUserId) {
      fetchTickets();
    } else if (!isInitializing) {
      setLoading(false);
      setError("ไม่พบรหัสผู้ใช้ LINE กรุณาเข้าใช้งานผ่านช่องทางที่กำหนด");
    }
  }, [lineUserId, isInitializing]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/repairs/liff/my-tickets?lineUserId=${lineUserId}`,
      );
      setTickets(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "WAITING_PARTS":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "เสร็จสิ้น";
      case "IN_PROGRESS":
        return "กำลังดำเนินการ";
      case "WAITING_PARTS":
        return "รออะไหล่";
      case "PENDING":
        return "รอดำเนินการ";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "URGENT":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  if (isInitializing || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium animate-pulse">
            {isInitializing
              ? "กำลังยืนยันตัวตน..."
              : "กำลังโหลดข้อมูลการแจ้งซ่อม..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            ติดตามสถานะงานซ่อม
          </h1>
          <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-2xl text-center shadow-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-80" />
            <h3 className="font-bold text-lg mb-1">เกิดข้อผิดพลาด</h3>
            <p className="text-sm opacity-90">{error}</p>
            <button
              onClick={fetchTickets}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-red-700 transition"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              ไม่พบประวัติการแจ้งซ่อม
            </h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
              คุณยังไม่เคยส่งรายการแจ้งซ่อมในระบบ
              หากมีปัญหาสามารถกดปุ่มด้านล่างเพื่อแจ้งซ่อมได้ทันที
            </p>
            <button
              onClick={() =>
                router.push(`/repairs/liff/form?lineUserId=${lineUserId}`)
              }
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
            >
              🚀 แจ้งซ่อมตอนนี้
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl border shadow-sm">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  ทั้งหมด
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {tickets.length}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    รายการ
                  </span>
                </p>
              </div>
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-100 text-white">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">
                  กำลังดำเนินการ
                </p>
                <p className="text-2xl font-black">
                  {
                    tickets.filter(
                      (t) =>
                        t.status === "IN_PROGRESS" || t.status === "PENDING",
                    ).length
                  }{" "}
                  <span className="text-sm font-normal text-blue-200">
                    รายการ
                  </span>
                </p>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
              ประวัติรายการ
            </h2>

            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() =>
                    router.push(
                      `/repairs/liff?action=history&id=${ticket.ticketCode}&lineUserId=${lineUserId}`,
                    )
                  }
                  className="bg-white border rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden group"
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      ticket.status === "COMPLETED"
                        ? "bg-green-500"
                        : ticket.status === "IN_PROGRESS"
                          ? "bg-blue-500"
                          : ticket.status === "WAITING_PARTS"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                    }`}
                  ></div>

                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">
                    {ticket.problemTitle}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {ticket.problemDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 font-medium">
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "th-TH",
                          { day: "numeric", month: "short", year: "2-digit" },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                      {getUrgencyIcon(ticket.urgency)}
                      <span className="text-xs text-slate-600 font-medium">
                        {ticket.urgency === "CRITICAL"
                          ? "ด่วนมาก"
                          : ticket.urgency === "URGENT"
                            ? "ด่วน"
                            : "ปกติ"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg ml-auto">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {ticket.ticketCode}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
          <button
            onClick={() =>
              router.push(`/repairs/liff/form?lineUserId=${lineUserId}`)
            }
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Wrench className="w-5 h-5 text-blue-400" />
            <span>แจ้งซ่อมเพิ่มเติม</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
