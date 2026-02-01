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
import { ChevronLeft, ChevronRight, MapPin, User, Clock } from "lucide-react";
import { apiFetch } from "@/services/api";
import { startOfDay } from "date-fns";

/* ================= TYPES ================= */

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
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    orange: "bg-orange-100 text-orange-800",
    green: "bg-green-100 text-green-800",
    default: "bg-gray-200 text-gray-800",
  };
  const bgClass = color
    ? colorClasses[color] || colorClasses.default
    : colorClasses.default;

  return (
    <div className={`${bgClass} p-4 rounded-lg`}>
      <span className="text-sm font-medium opacity-80">{label}</span>
      <div className="mt-2">
        <span className="text-3xl font-bold">{value}</span>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

function CalendarContent() {
  const [events, setEvents] = useState<RepairEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
    <div className="bg-white p-5 rounded-lg border border-gray-200 relative hover:shadow-md transition-shadow mb-4">
      <div
        className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(event.status)}`}
      >
        {statusMap[event.status]}
      </div>

      <div className="pr-24">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {event.problemTitle}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
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
            onClick={() => setSelectedDate(startOfDay(currentDay))}
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
      <div className="bg-white p-6 rounded-xl border">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h3>
          <div className="flex gap-2">
            <ChevronLeft
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            />
            <ChevronRight
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
          <StatCard label="รอรับงาน" value={stats.pending} />
          <StatCard label="กำลังดำเนินการ" value={stats.inProgress} />
          <StatCard label="เสร็จสิ้น" value={stats.completed} />
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
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                ค้นหา
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none"
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
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none"
            >
              <option value="all">ทุกความสำคัญ</option>
              <option value="NORMAL">ปกติ</option>
              <option value="URGENT">ด่วน</option>
              <option value="CRITICAL">ด่วนมาก</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Repair Lists */}
          <div className="lg:col-span-8 space-y-6">
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

          {/* Right: Mini Calendar */}
          <div className="lg:col-span-4">{renderMiniCalendar()}</div>
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
