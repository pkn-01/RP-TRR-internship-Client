"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Wrench,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  MapPin,
  User,
  Image as ImageIcon,
  Plus,
  Calendar as CalendarIcon,
  XCircle,
  PlayCircle,
  Package,
} from "lucide-react";
import { apiFetch } from "@/services/api";
// import liff from "@line/liff"; // Moved to dynamic import inside useEffect

export const dynamic = "force-dynamic";

// --- Types ---
interface TicketLog {
  status: string;
  action?: string;
  comment?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface TicketAttachment {
  fileUrl: string;
  fileName?: string;
}

interface Ticket {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription: string;
  problemCategory: string;
  location: string;
  urgency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reporterName: string;
  reporterPhone: string;
  assignees?: {
    user: {
      name: string;
      avatar?: string;
    };
  }[];
  logs?: TicketLog[];
  attachments?: TicketAttachment[];
}

// --- Helper Functions ---
/**
 * Convert date string to local date in YYYY-MM-DD format
 * This prevents timezone issues when comparing dates
 */
const toLocalDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- Components ---
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700" },
    IN_PROGRESS: {
      label: "กำลังดำเนินการ",
      color: "bg-blue-100 text-blue-700",
    },
    WAITING_PARTS: {
      label: "รออะไหล่",
      color: "bg-yellow-100 text-yellow-700",
    },
    PENDING: { label: "รอรับเรื่อง", color: "bg-gray-100 text-gray-700" },
    CANCELLED: { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
  };
  const { label, color } = config[status] || config.PENDING;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

function RepairLiffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const actionFromParam = searchParams.get("action");
  const ticketIdFromParam = searchParams.get("id");
  const action = actionFromParam || (ticketIdFromParam ? "history" : "status");

  const [lineUserId, setLineUserId] = useState<string>(
    searchParams.get("lineUserId") || "",
  );
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    pictureUrl?: string;
  } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(
    !searchParams.get("lineUserId"),
  );
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // LIFF Init & Data Fetch logic
  useEffect(() => {
    let isMounted = true;

    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        if (!liffId) {
          console.error("LIFF ID not found");
          if (isMounted) setIsInitializing(false);
          return;
        }

        // Import dynamically to avoid SSR/Hydration issues
        const liff = (await import("@line/liff")).default;

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
          return; // Redirecting to login
        }

        const profile = await liff.getProfile();
        const userId = profile.userId;

        if (isMounted) {
          setLineUserId(userId);
          setUserProfile({
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          });

          // Execute primary action based on initial state
          if (action === "create") {
            // Use window.location for hard redirect to ensure LIFF SDK clean state on target page
            window.location.href = `/repairs/liff/form?lineUserId=${userId}`;
            return; // Exit early as we are redirecting
          } else if (action === "status") {
            // Internal function fetchTickets uses the latest state or we can call it here manually
            // But we'll let the second effect handle it or call it here
            setLoading(true);
            try {
              const data = await apiFetch(
                `/api/repairs/liff/my-tickets?lineUserId=${userId}`,
              );
              setTickets(data || []);

              // If user has no tickets (first-time user), redirect to form page
              if (!data || data.length === 0) {
                window.location.href = `/repairs/liff/form?lineUserId=${userId}`;
                return;
              }
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
            }
          } else if (action === "history" && ticketIdFromParam) {
            setLoading(true);
            try {
              const data = await apiFetch(
                `/api/repairs/liff/ticket/${ticketIdFromParam}?lineUserId=${userId}`,
              );
              setTicketDetail(data);
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
        // setIsInitializing will be handled in finally block
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initLiff();

    return () => {
      isMounted = false;
    };
  }, [action, ticketIdFromParam]);

  // Removed unused fetchTickets and fetchTicketDetail functions
  // All fetching is done inline in the useEffect above

  const getUrgencyLabel = (u: string) => {
    switch (u) {
      case "CRITICAL":
        return "ด่วนที่สุด";
      case "URGENT":
        return "ด่วน";
      default:
        return "ปกติ";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      COMPLETED: "เสร็จสิ้น",
      IN_PROGRESS: "กำลังดำเนินการ",
      WAITING_PARTS: "รออะไหล่",
      PENDING: "รอรับเรื่อง",
      CANCELLED: "ยกเลิก",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "bg-green-500",
      IN_PROGRESS: "bg-blue-500",
      WAITING_PARTS: "bg-yellow-500",
      PENDING: "bg-gray-400",
      CANCELLED: "bg-red-500",
    };
    return colors[status] || "bg-gray-400";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-3 h-3 text-white" />;
      case "IN_PROGRESS":
        return <PlayCircle className="w-3 h-3 text-white" />;
      case "WAITING_PARTS":
        return <Package className="w-3 h-3 text-white" />;
      case "CANCELLED":
        return <XCircle className="w-3 h-3 text-white" />;
      default:
        return <Clock className="w-3 h-3 text-white" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calendar logic (must be at top level - React Hooks rule)
  // Pre-process tickets by date for performance
  const ticketsByDate = useMemo(() => {
    const map = new Map<string, Ticket[]>();
    tickets.forEach((t) => {
      const dateStr = toLocalDate(t.createdAt);
      const existing = map.get(dateStr) || [];
      map.set(dateStr, [...existing, t]);
    });
    return map;
  }, [tickets]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (null | {
      day: number;
      dateStr: string;
      ticketCount: number;
      hasCompleted: boolean;
    })[] = [];

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayTickets = ticketsByDate.get(dateStr) || [];
      days.push({
        day: d,
        dateStr,
        ticketCount: dayTickets.length,
        hasCompleted: dayTickets.some((t) => t.status === "COMPLETED"),
      });
    }
    return days;
  }, [currentMonth, ticketsByDate]);

  const filteredTickets = selectedDate
    ? tickets.filter((t) => toLocalDate(t.createdAt) === selectedDate)
    : tickets;

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  // Loading Screen
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // --- Main Dashboard View ---
  if (action === "status") {
    const pendingCount = tickets.filter((t) =>
      ["IN_PROGRESS", "WAITING_PARTS"].includes(t.status),
    ).length;
    const completedCount = tickets.filter(
      (t) => t.status === "COMPLETED",
    ).length;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center gap-3">
            {userProfile?.pictureUrl ? (
              <img
                src={userProfile.pictureUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {userProfile?.displayName || "ผู้ใช้งาน"}
              </p>
              <p className="text-xs text-gray-500">ระบบแจ้งซ่อม</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center border">
            <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            <p className="text-xs text-gray-500">ทั้งหมด</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500">กำลังดำเนินการ</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border">
            <p className="text-2xl font-bold text-green-600">
              {completedCount}
            </p>
            <p className="text-xs text-gray-500">เสร็จสิ้น</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-lg border p-3">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-medium text-gray-900 text-sm">
                  {currentMonth.toLocaleDateString("th-TH", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((name) => (
                <div
                  key={name}
                  className="text-center text-[10px] text-gray-400 font-medium py-0.5"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="h-8">
                  {day && (
                    <button
                      onClick={() =>
                        setSelectedDate(
                          selectedDate === day.dateStr ? null : day.dateStr,
                        )
                      }
                      className={`w-full h-full flex flex-col items-center justify-center rounded text-xs transition-all relative
                        ${
                          selectedDate === day.dateStr
                            ? "bg-blue-600 text-white"
                            : day.ticketCount > 0
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className="font-medium text-xs">{day.day}</span>
                      {day.ticketCount > 0 && (
                        <div
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            selectedDate === day.dateStr
                              ? "bg-white"
                              : day.hasCompleted
                                ? "bg-green-500"
                                : "bg-blue-500"
                          }`}
                        />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  วันที่{" "}
                  {new Date(selectedDate).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                  })}
                  : {filteredTickets.length} รายการ
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  ดูทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>

        {/* New Repair Button */}
        <div className="px-4 mb-4">
          <button
            onClick={() =>
              (window.location.href = `/repairs/liff/form?lineUserId=${lineUserId}`)
            }
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            แจ้งซ่อมใหม่
          </button>
        </div>

        {/* Ticket List */}
        <div className="px-4 pb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            {selectedDate
              ? `รายการแจ้งซ่อมวันที่ ${new Date(selectedDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`
              : "รายการแจ้งซ่อมของคุณ"}
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-4 animate-pulse border"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {selectedDate
                  ? "ไม่มีรายการแจ้งซ่อมในวันนี้"
                  : "ยังไม่มีรายการแจ้งซ่อม"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {selectedDate
                  ? "ลองเลือกวันอื่น หรือกดปุ่มแจ้งซ่อมใหม่"
                  : "กดปุ่มด้านบนเพื่อแจ้งซ่อมใหม่"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() =>
                    router.push(
                      `/repairs/liff?action=history&id=${ticket.ticketCode}&lineUserId=${lineUserId}`,
                    )
                  }
                  className="bg-white rounded-lg p-4 border hover:border-blue-300 active:bg-gray-50 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 font-mono">
                      #{ticket.ticketCode}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">
                    {ticket.problemTitle}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(ticket.createdAt)}
                        </span>
                        {ticket.urgency !== "NORMAL" && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {getUrgencyLabel(ticket.urgency)}
                          </span>
                        )}
                      </div>
                      {ticket.assignees && ticket.assignees.length > 0 && (
                        <div className="flex items-center gap-1 text-blue-600 mt-1">
                          <User className="w-3.5 h-3.5" />
                          <span>
                            ผู้รับผิดชอบ:{" "}
                            {ticket.assignees
                              .map((a) => a.user.name)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Detailed Ticket View ---
  if (action === "history") {
    if (loading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">กำลังโหลด...</p>
          </div>
        </div>
      );
    }

    if (!ticketDetail) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            ไม่พบข้อมูลใบแจ้งซ่อม
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            รหัสที่คุณต้องการอาจไม่ถูกต้องหรือถูกลบไปแล้ว
          </p>
          <button
            onClick={() => router.back()}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium"
          >
            กลับ
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <p className="text-xs text-gray-500">#{ticketDetail.ticketCode}</p>
            <h1 className="font-semibold text-gray-900">
              รายละเอียดใบแจ้งซ่อม
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Main Info Card */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500">
                {formatDateTime(ticketDetail.createdAt)}
              </span>
              <StatusBadge status={ticketDetail.status} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {ticketDetail.problemTitle}
            </h2>
            <p className="text-gray-600 text-sm">
              {ticketDetail.problemDescription || "ไม่ได้ระบุรายละเอียด"}
            </p>
          </div>

          {/* Detail Info */}
          <div className="bg-white rounded-lg border divide-y">
            <div className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">สถานที่</p>
                <p className="text-gray-900">{ticketDetail.location || "-"}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">ความเร่งด่วน</p>
                <p className="text-gray-900">
                  {getUrgencyLabel(ticketDetail.urgency)}
                </p>
              </div>
            </div>
            {ticketDetail.assignees && ticketDetail.assignees.length > 0 && (
              <div className="p-4 flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">ช่างผู้ดูแล</p>
                  <p className="text-gray-900">
                    {ticketDetail.assignees.map((a) => a.user.name).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          {ticketDetail.attachments && ticketDetail.attachments.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                รูปภาพประกอบ
              </h3>
              <div className="flex gap-2 overflow-x-auto">
                {ticketDetail.attachments.map((file, idx) => (
                  <img
                    key={idx}
                    src={file.fileUrl}
                    alt="รูปแนบ"
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() =>
              router.push(
                `/repairs/liff?action=status&lineUserId=${lineUserId}`,
              )
            }
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 active:scale-[0.98] transition-all"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (action === "create") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return null;
}

export default function RepairLiffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <RepairLiffContent />
    </Suspense>
  );
}
