"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import {
  AlertCircle,
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
} from "lucide-react";
import { apiFetch } from "@/services/api";

export const dynamic = "force-dynamic";

/* =======================
   Types
======================= */
interface Ticket {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription: string;
  location: string;
  urgency: string;
  status: string;
  createdAt: string;
  assignees?: { user: { name: string } }[];
  attachments?: { fileUrl: string }[];
  logs?: TicketLog[];
}

interface TicketLog {
  status: string;
  action?: string;
  comment?: string;
  createdAt: string;
  user?: { name: string };
}

/* =======================
   Helpers
======================= */
const toLocalDate = (d: string) =>
  new Date(d).toLocaleDateString("sv-SE"); // YYYY-MM-DD

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const urgencyLabel = (u: string) =>
  u === "CRITICAL" ? "ด่วนที่สุด" : u === "URGENT" ? "ด่วน" : "ปกติ";

/* =======================
   Status Badge
======================= */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    WAITING_PARTS: "bg-yellow-100 text-yellow-700",
    PENDING: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        map[status] || map.PENDING
      }`}
    >
      {status}
    </span>
  );
};

/* =======================
   Main Content
======================= */
function RepairLiffContent() {
  const params = useSearchParams();
  const router = useRouter();

  const action =
    params.get("action") || (params.get("id") ? "history" : "status");
  const ticketCode = params.get("id");

  const [lineUserId, setLineUserId] = useState("");
  const [profile, setProfile] = useState<{
    displayName: string;
    pictureUrl?: string;
  } | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [init, setInit] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* =======================
     LIFF Init
  ======================= */
  useEffect(() => {
    let mounted = true;

    const initLiff = async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
          withLoginOnExternalBrowser: true,
        });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const p = await liff.getProfile();
        if (!mounted) return;

        setLineUserId(p.userId);
        setProfile({
          displayName: p.displayName,
          pictureUrl: p.pictureUrl,
        });

        if (action === "status") await fetchTickets(p.userId);
        if (action === "history" && ticketCode)
          await fetchTicket(p.userId, ticketCode);

        if (action === "create") {
          window.location.href = `/repairs/liff/form?lineUserId=${p.userId}`;
        }
      } catch (e) {
        console.error(e);
      } finally {
        mounted && setInit(false);
      }
    };

    initLiff();
    return () => {
      mounted = false;
    };
  }, [action, ticketCode]);

  /* =======================
     API
  ======================= */
  const fetchTickets = async (uid: string) => {
    setLoading(true);
    const data = await apiFetch(
      `/api/repairs/liff/my-tickets?lineUserId=${uid}`,
    );
    setTickets(data || []);
    setLoading(false);
  };

  const fetchTicket = async (uid: string, code: string) => {
    setLoading(true);
    const data = await apiFetch(
      `/api/repairs/liff/ticket/${code}?lineUserId=${uid}`,
    );
    setTicketDetail(data);
    setLoading(false);
  };

  /* =======================
     Calendar Logic
  ======================= */
  const ticketsByDate = useMemo(() => {
    const map = new Map<string, Ticket[]>();
    tickets.forEach((t) => {
      const d = toLocalDate(t.createdAt);
      map.set(d, [...(map.get(d) || []), t]);
    });
    return map;
  }, [tickets]);

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    const days: any[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);

    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const list = ticketsByDate.get(dateStr) || [];
      days.push({
        day: d,
        dateStr,
        count: list.length,
        done: list.some((t) => t.status === "COMPLETED"),
      });
    }
    return days;
  }, [currentMonth, ticketsByDate]);

  const filteredTickets = selectedDate
    ? ticketsByDate.get(selectedDate) || []
    : tickets;

  if (init) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  /* =======================
     STATUS (Dashboard)
  ======================= */
  if (action === "status") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center gap-3">
          {profile?.pictureUrl ? (
            <img
              src={profile.pictureUrl}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <p className="font-semibold">{profile?.displayName}</p>
            <p className="text-xs text-gray-500">ระบบแจ้งซ่อม</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="p-4">
          <div className="bg-white rounded-lg border p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium flex gap-1 items-center">
                <CalendarIcon className="w-4 h-4" />
                {currentMonth.toLocaleDateString("th-TH", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                >
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => (
                <div key={i} className="h-8">
                  {d && (
                    <button
                      onClick={() =>
                        setSelectedDate(
                          selectedDate === d.dateStr ? null : d.dateStr,
                        )
                      }
                      className={`w-full h-full rounded text-xs ${
                        selectedDate === d.dateStr
                          ? "bg-blue-600 text-white"
                          : d.count
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-100"
                      }`}
                    >
                      {d.day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* New */}
        <div className="px-4 mb-3">
          <button
            onClick={() =>
              (window.location.href = `/repairs/liff/form?lineUserId=${lineUserId}`)
            }
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center gap-2"
          >
            <Plus /> แจ้งซ่อมใหม่
          </button>
        </div>

        {/* List */}
        <div className="px-4 pb-6 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400">กำลังโหลด...</p>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center border">
              <Wrench className="mx-auto mb-2 text-gray-300" />
              ไม่มีรายการแจ้งซ่อม
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() =>
                  router.push(
                    `/repairs/liff?action=history&id=${t.ticketCode}`,
                  )
                }
                className="bg-white p-4 rounded-lg border cursor-pointer"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">
                    #{t.ticketCode}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <p className="font-medium">{t.problemTitle}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <Clock className="inline w-3 h-3 mr-1" />
                  {formatDate(t.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* =======================
     HISTORY (Detail)
  ======================= */
  if (action === "history" && ticketDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white p-4 flex items-center gap-2 border-b">
          <button onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <p className="font-semibold">#{ticketDetail.ticketCode}</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <StatusBadge status={ticketDetail.status} />
            <h2 className="font-semibold mt-2">
              {ticketDetail.problemTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {ticketDetail.problemDescription}
            </p>
          </div>

          {ticketDetail.attachments?.length ? (
            <div className="bg-white p-4 rounded-lg border">
              <p className="font-medium mb-2">รูปภาพ</p>
              <div className="flex gap-2 overflow-x-auto">
                {ticketDetail.attachments.map((f, i) => (
                  <img
                    key={i}
                    src={f.fileUrl}
                    className="w-24 h-24 rounded object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

/* =======================
   Page Wrapper
======================= */
export default function RepairLiffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <RepairLiffContent />
    </Suspense>
  );
}
