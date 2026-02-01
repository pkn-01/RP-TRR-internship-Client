"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader, RefreshCw, X } from "lucide-react";
import { apiFetch } from "@/services/api";

interface RepairTicket {
  id: number;
  ticketCode: string;
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  problemTitle: string;
  problemCategory: string;
  problemDescription: string;
  location: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function CompletedRepairsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<string>("ALL");
  const [filterMonth, setFilterMonth] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRepairs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filterUrgency, filterMonth, searchTerm]);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/repairs?status=COMPLETED", "GET");
      if (Array.isArray(response)) {
        const sortedTickets = response.sort(
          (a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setTickets(sortedTickets);
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepairs();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = tickets;

    if (filterUrgency !== "ALL") {
      filtered = filtered.filter((t) => t.urgency === filterUrgency);
    }

    if (filterMonth !== "ALL") {
      const filterDate = new Date(filterMonth);
      filtered = filtered.filter((t) => {
        const ticketDate = new Date(t.updatedAt);
        return (
          ticketDate.getMonth() === filterDate.getMonth() &&
          ticketDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(term) ||
          t.reporterName.toLowerCase().includes(term) ||
          t.problemTitle.toLowerCase().includes(term) ||
          t.location.toLowerCase().includes(term)
      );
    }

    setFilteredTickets(filtered);
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "ด่วนมาก";
      case "URGENT":
        return "ด่วน";
      default:
        return "ปกติ";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border border-red-200";
      case "URGENT":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const calculateDays = (createdAt: string, updatedAt: string) => {
    const start = new Date(createdAt);
    const end = new Date(updatedAt);
    return Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const clearFilters = () => {
    setFilterUrgency("ALL");
    setFilterMonth("ALL");
    setSearchTerm("");
  };

  const getAvailableMonths = () => {
    const months: { value: string; label: string }[] = [];
    const monthSet = new Set<string>();

    tickets.forEach((ticket) => {
      const date = new Date(ticket.updatedAt);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthSet.add(yearMonth);
    });

    Array.from(monthSet)
      .sort()
      .reverse()
      .forEach((ym) => {
        const [year, month] = ym.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        months.push({
          value: ym,
          label: date.toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          }),
        });
      });

    return months;
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 lg:ml-56">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">เสร็จสิ้น</h1>
          <p className="text-gray-500 mt-2 text-sm">งานซ่อมที่เสร็จเรียบร้อยแล้ว</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw
            size={20}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="ค้นหา: รหัสงาน, ชื่อผู้แจ้ง, เรื่องซ่อม, สถานที่..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
        />

        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
        >
          <option value="ALL">ทั้งหมด</option>
          <option value="NORMAL">ปกติ</option>
          <option value="URGENT">ด่วน</option>
          <option value="CRITICAL">ด่วนมาก</option>
        </select>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
        >
          <option value="ALL">ทั้งหมด</option>
          {getAvailableMonths().map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>

        {(filterUrgency !== "ALL" || filterMonth !== "ALL" || searchTerm) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm"
          >
            <X size={16} />
            ล้าง
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
            ทั้งหมด
          </p>
          <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
            เฉลี่ยวันในการซ่อม
          </p>
          <p className="text-2xl font-bold text-slate-700">
            {tickets.length > 0
              ? (
                  tickets.reduce(
                    (sum, t) => sum + calculateDays(t.createdAt, t.updatedAt),
                    0
                  ) / tickets.length
                ).toFixed(1)
              : "0"}
            {" วัน"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
            อัตราความสำเร็จ
          </p>
          <p className="text-2xl font-bold text-green-700">100%</p>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size={32} className="animate-spin text-gray-400" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {tickets.length === 0
                ? "ไม่มีงานซ่อมที่เสร็จแล้ว"
                : "ไม่พบงานซ่อมตรงกับเงื่อนไขการค้นหา"}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const daysToComplete = calculateDays(
              ticket.createdAt,
              ticket.updatedAt
            );
            return (
              <div
                key={ticket.id}
                onClick={() => router.push(`/repairs/details/${ticket.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ticket.ticketCode}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      <p>
                        แจ้ง:{" "}
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "th-TH"
                        )}
                      </p>
                      <p>
                        เสร็จ:{" "}
                        {new Date(ticket.updatedAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getUrgencyColor(ticket.urgency)}`}>
                      {getUrgencyLabel(ticket.urgency)}
                    </span>
                    <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600">
                        ใช้เวลา
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {daysToComplete === 0 ? "< 1 วัน" : `${daysToComplete} วัน`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      ผู้แจ้ง
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {ticket.reporterName}
                    </p>
                    <p className="text-sm text-gray-600">{ticket.reporterDepartment}</p>
                    <p className="text-sm text-gray-600">{ticket.reporterPhone}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      สถานที่
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {ticket.location}
                    </p>
                    {ticket.assignee && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-0.5">
                          ผู้รับผิดชอบ
                        </p>
                        <p className="text-sm text-gray-900">
                          {ticket.assignee.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                    เรื่องซ่อม
                  </p>
                  <p className="text-base text-gray-900 font-medium">
                    {ticket.problemTitle}
                  </p>
                </div>

                {ticket.problemDescription && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      รายละเอียด
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {ticket.problemDescription}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!loading && filteredTickets.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          แสดง {filteredTickets.length} จากทั้งหมด {tickets.length} รายการ
        </div>
      )}
    </div>
  );
}
