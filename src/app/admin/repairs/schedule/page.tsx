"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
  endOfDay,
  isAfter,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Clock,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import { startOfDay } from "date-fns";

/* ================= TYPES ================= */

interface Assignee {
  id: number;
  userId: number;
  user: {
    name: string;
    role: string;
  };
}

interface Attachment {
  id: number;
  fileUrl: string;
  filename: string;
}

interface RepairEvent {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  status: string;
  urgency: string;
  createdAt: string;
  scheduledAt: string;
  completedAt?: string;
  reporterName: string;
  location: string;
  // Detail fields (optional as they come from separate fetch)
  assignees?: Assignee[];
  attachments?: Attachment[];
  notes?: string;
}

const statusMap: Record<string, string> = {
  PENDING: "รอรับงาน",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  WAITING_PARTS: "รออะไหล่",
};

/* ================= STAT CARD COMPONENT ================= */

function StatCard({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status?: string;
}) {
  return (
    <div className="bg-[#E9ECEF] p-4 rounded-xl relative flex flex-col justify-center min-h-[100px]">
      <span className="text-gray-600 text-sm mb-1">{label}</span>
      <span className="text-4xl font-bold text-gray-900">{value}</span>
      {status && (
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              status === "PENDING"
                ? "bg-yellow-100 text-yellow-700"
                : status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-700"
                  : status === "COMPLETED"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {statusMap[status]}
          </span>
        </div>
      )}
    </div>
  );
}

/* ================= DETAIL PANEL COMPONENT ================= */

function RepairDetailPanel({
  event,
  isLoadingDetail,
  onClose,
  onUpdateStatus,
}: {
  event: RepairEvent;
  isLoadingDetail: boolean;
  onClose: () => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
}) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-[#FFF9DB] text-[#F08C00]",
      IN_PROGRESS: "bg-[#E7F5FF] text-[#228BE6]",
      COMPLETED: "bg-[#EBFBEE] text-[#40C057]",
      CANCELLED: "bg-[#F1F3F5] text-[#868E96]",
      WAITING_PARTS: "bg-[#FFF4E6] text-[#FD7E14]",
    };
    return (
      <span
        className={`px-3 py-1 rounded-lg text-xs font-bold ${styles[status] || styles.PENDING}`}
      >
        {statusMap[status] || status}
      </span>
    );
  };

  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAcceptWork = async () => {
    if (isActionLoading) return;

    try {
      if (confirm("ต้องการรับงานนี้ใช่หรือไม่?")) {
        setIsActionLoading(true);
        await apiFetch(`/api/repairs/${event.id}`, {
          method: "PUT",
          body: {
            status: "IN_PROGRESS",
          },
        });

        onUpdateStatus(event.id, "IN_PROGRESS");
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการรับงาน");
    } finally {
      setIsActionLoading(false);
    }
  };

  const assigneeNames =
    event.assignees && event.assignees.length > 0
      ? event.assignees.map((a) => a.user.name).join(", ")
      : "ยังไม่ระบุ";

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col relative animate-fade-in-right">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
      >
        <X size={20} className="text-gray-400" />
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2 pr-10">
          {event.problemTitle}
        </h2>
        <div>{getStatusBadge(event.status)}</div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* Time */}
        <div className="flex gap-4">
          <Clock size={20} className="text-gray-400 mt-1 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-0.5">เวลา</p>
            <p className="text-sm text-gray-800 font-medium">
              {format(
                parseISO(event.scheduledAt || event.createdAt),
                "EEEE, HH:mm dd/MM/yyyy",
                { locale: th },
              )}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex gap-4">
          <MapPin size={20} className="text-gray-400 mt-1 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-0.5">
              สถานที่
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {event.location || "-"}
            </p>
          </div>
        </div>

        {/* Reporter */}
        <div className="flex gap-4">
          <User size={20} className="text-gray-400 mt-1 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-0.5">
              ชื่อผู้แจ้ง
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {event.reporterName || "ไม่ระบุ"}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="flex gap-4">
          <FileText size={20} className="text-gray-400 mt-1 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-0.5">
              รายละเอียดปัญหา
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {event.problemDescription || "-"}
            </p>
          </div>
        </div>

        {/* Assignee */}
        <div className="flex gap-4">
          <User size={20} className="text-gray-400 mt-1 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-0.5">
              ผู้รับผิดชอบ
            </p>
            <p className="text-sm text-gray-800 font-medium">
              {isLoadingDetail ? "กำลังโหลด..." : assigneeNames}
            </p>
          </div>
        </div>

        {/* Images */}
        <div className="flex gap-4 pb-4">
          <ImageIcon size={20} className="text-gray-400 mt-1 shrink-0" />
          <div className="w-full flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-2">รูปภาพ</p>
            <div className="w-full bg-gray-50 rounded-xl overflow-hidden min-h-[100px] flex flex-col gap-2 p-1">
              {isLoadingDetail ? (
                <div className="p-8 text-xs text-gray-400 text-center">
                  กำลังโหลดรูปภาพ...
                </div>
              ) : event.attachments && event.attachments.length > 0 ? (
                event.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-100"
                  >
                    <img
                      src={att.fileUrl}
                      alt={att.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-gray-400 text-xs">
                    ไม่มีรูปภาพประกอบ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-6 border-t border-gray-100 flex gap-3">
        <button className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">
          แก้ไข
        </button>
        <button className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">
          มอบหมาย
        </button>
        <button
          onClick={handleAcceptWork}
          disabled={isActionLoading}
          className={`flex-[1.5] py-2.5 rounded-xl text-sm font-bold transition-colors ${
            isActionLoading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#E7F5FF] text-[#228BE6] hover:bg-[#D0EBFF]"
          }`}
        >
          {isActionLoading ? "กำลังบันทึก..." : "รับงาน"}
        </button>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

function CalendarContent() {
  const [events, setEvents] = useState<RepairEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTicket, setSelectedTicket] = useState<RepairEvent | null>(
    null,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  /* ========== FETCH ========== */
  const fetchEvents = useCallback(async () => {
    const data = await apiFetch("/api/repairs/schedule");
    setEvents(data || []);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ========== FETCH DETAIL ========== */
  const fetchDetail = async (id: number) => {
    setIsLoadingDetail(true);
    try {
      const detail = await apiFetch(`/api/repairs/${id}`);
      if (detail) {
        setSelectedTicket((prev) => (prev ? { ...prev, ...detail } : detail));
      }
    } catch (err) {
      console.error("Failed to load detail", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  /* ========== STATS ========== */
  const stats = useMemo(
    () => ({
      total: events.length,
      pending: events.filter((e) => e.status === "PENDING").length,
      inProgress: events.filter((e) => e.status === "IN_PROGRESS").length,
      completed: events.filter((e) => e.status === "COMPLETED").length,
    }),
    [events],
  );

  /* ========== HELPER: Get event date ========== */
  const getEventDate = useCallback((e: RepairEvent): Date => {
    const rawDate = e.scheduledAt || e.createdAt;
    return startOfDay(parseISO(rawDate));
  }, []);

  /* ========== FILTER ========== */
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (e.problemTitle?.toLowerCase() || "").includes(q) ||
        (e.ticketCode?.toLowerCase() || "").includes(q) ||
        (e.reporterName?.toLowerCase() || "").includes(q) ||
        (e.location?.toLowerCase() || "").includes(q);

      const matchesStatus = filterStatus === "all" || e.status === filterStatus;

      const matchesPriority =
        filterPriority === "all" || e.urgency === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [events, searchQuery, filterStatus, filterPriority]);

  /* ========== DATE-BASED EVENTS ========== */
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter((e) =>
      isSameDay(getEventDate(e), selectedDate),
    );
  }, [filteredEvents, selectedDate, getEventDate]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter((e) =>
      isAfter(getEventDate(e), endOfDay(selectedDate)),
    );
  }, [filteredEvents, selectedDate, getEventDate]);

  /* ========== CALENDAR MAP (FAST) ========== */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, RepairEvent[]>();
    filteredEvents.forEach((e) => {
      const key = format(getEventDate(e), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) || []), e]);
    });
    return map;
  }, [filteredEvents, getEventDate]);

  /* ========== HANDLERS ========== */
  const handleTicketClick = (event: RepairEvent) => {
    setSelectedTicket(event);
    fetchDetail(event.id);
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
  };

  /* ========== COMPONENTS ========== */

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
      WAITING_PARTS: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return styles[status] || styles.PENDING;
  };

  const RepairCard = ({ event }: { event: RepairEvent }) => (
    <div
      onClick={() => handleTicketClick(event)}
      className={`bg-white p-5 rounded-xl border transition-all cursor-pointer mb-4 relative
        ${selectedTicket?.id === event.id ? "border-blue-500 shadow-md ring-1 ring-blue-500" : "border-gray-200 hover:shadow-md"}
      `}
    >
      <div
        className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold rounded-lg ${getStatusStyle(event.status)}`}
      >
        {statusMap[event.status]}
      </div>

      <div className="pr-24 relative">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {event.problemTitle}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-1">
          {event.problemDescription || "-"}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          {format(parseISO(event.scheduledAt || event.createdAt), "HH:mm")}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          {event.location || "-"}
        </div>
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          {event.reporterName || "ไม่ระบุ"}
        </div>
      </div>
    </div>
  );

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    let day = startDate;
    const rows = [];

    while (day <= endDate) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        // ✅ Capture วันที่ปัจจุบันเพื่อแก้ปัญหา closure
        const currentDay = day;
        const key = format(currentDay, "yyyy-MM-dd");
        const hasEvents = eventsByDate.get(key)?.length || 0;
        const isToday = isSameDay(currentDay, new Date());
        const isSelected = isSameDay(currentDay, selectedDate);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);

        days.push(
          <div
            key={key}
            onClick={() => {
              setSelectedDate(startOfDay(currentDay));
              setSelectedTicket(null); // Clear selection when date changes
            }}
            className={`h-10 w-10 rounded-full flex flex-col items-center justify-center cursor-pointer transition-colors
              ${!isCurrentMonth ? "text-gray-300" : "text-gray-700"}
              ${isSelected ? "bg-blue-500 text-white font-bold" : "hover:bg-gray-100"}
              ${isToday && !isSelected ? "ring-2 ring-blue-300" : ""}
            `}
          >
            <span className="text-sm">{format(currentDay, "d")}</span>
            {hasEvents > 0 && (
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: Math.min(3, hasEvents) }).map(
                  (_, idx) => (
                    <span
                      key={idx}
                      className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}
                    />
                  ),
                )}
              </div>
            )}
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={`row-${rows.length}`} className="grid grid-cols-7 gap-1">
          {days}
        </div>,
      );
    }

    return (
      <div className="bg-white p-6 rounded-xl border animate-fade-in-up">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h3>
          <div className="flex gap-2">
            <ChevronLeft
              className="cursor-pointer hover:text-blue-500"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            />
            <ChevronRight
              className="cursor-pointer hover:text-blue-500"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            />
          </div>
        </div>
        <div className="space-y-2">{rows}</div>
      </div>
    );
  };

  /* ========== RENDER ========== */

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="รายการซ่อมทั้งหมด" value={stats.total} />
          <StatCard label="รอรับงาน" value={stats.pending}  />
          <StatCard
            label="กำลังดำเนินการ"
            value={stats.inProgress}
            
          />
          <StatCard
            label="เสร็จสิ้น"
            value={stats.completed}
            
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้แจ้ง/เลขรหัส"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                ค้นหา
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22gray%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22/%3E%3C/svg%3E')] bg-[length:1.2em_1.2em] bg-[right_0.75rem_center] bg-no-repeat"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="PENDING">รอรับงาน</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22gray%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22/%3E%3C/svg%3E')] bg-[length:1.2em_1.2em] bg-[right_0.75rem_center] bg-no-repeat"
            >
              <option value="all">ทุกความสำคัญ</option>
              <option value="NORMAL">ปกติ</option>
              <option value="URGENT">ด่วน</option>
              <option value="CRITICAL">ด่วนมาก</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
          {/* Left: Repair Lists (Scrollable) */}
          <div className="lg:col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10">
            <section className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-900">
                {format(selectedDate, "dd MMMM yyyy", { locale: th })}
              </h2>

              {selectedDateEvents.length ? (
                <div className="space-y-4">
                  {selectedDateEvents.map((e) => (
                    <RepairCard key={e.id} event={e} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">ไม่มีงานในวันนี้</p>
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-900">
                งานที่กำลังจะมาถึง
              </h2>
              {upcomingEvents.length ? (
                <div className="space-y-4">
                  {upcomingEvents.map((e) => (
                    <RepairCard key={e.id} event={e} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">ไม่มีงานที่กำลังจะมาถึง</p>
                </div>
              )}
            </section>
          </div>

          {/* Right: Detail or Mini Calendar */}
          <div className="lg:col-span-4 h-full">
            {selectedTicket ? (
              <RepairDetailPanel
                event={selectedTicket}
                isLoadingDetail={isLoadingDetail}
                onClose={() => setSelectedTicket(null)}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              renderMiniCalendar()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= EXPORT ================= */

export default function RepairSchedulePage() {
  return (
    <Suspense fallback={<div className="p-10">กำลังโหลด...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
