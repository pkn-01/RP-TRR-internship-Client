"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/services/api";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Paperclip,
  MessageSquare,
  Edit2,
  Trash2,
} from "lucide-react";

interface Attachment {
  id: number;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface TicketLog {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
}

interface Ticket {
  id: number;
  ticketCode: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  problemCategory: string;
  problemSubcategory: string;
  equipmentName: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
  attachments: Attachment[];
  logs: TicketLog[];
}

export default function TicketDetail() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/admin");
          return;
        }

        const data = await apiFetch(`/api/tickets/${ticketId}`).catch((err) => {
          if (err.message.includes("401")) {
            localStorage.removeItem("token");
            router.push("/login/admin");
            throw new Error("Session expired");
          }
          throw err;
        });
        setTicket(data);
      } catch (err: any) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, router]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "LOW":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
          >
            <ArrowLeft size={20} />
            <span>กลับไปยังรายการแจ้งซ่อม</span>
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            <AlertCircle className="inline mr-3" size={20} />
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
          >
            <ArrowLeft size={20} />
            <span>กลับไปยังรายการแจ้งซ่อม</span>
          </Link>
          <div className="text-center text-slate-600">ไม่พบรายการแจ้งซ่อม</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          <span>กลับไปยังรายการแจ้งซ่อม</span>
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {ticket.title}
              </h1>
              <p className="text-slate-500 text-lg">#{ticket.ticketCode}</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-medium">
                <Edit2 size={16} />
                <span className="hidden sm:inline">แก้ไข</span>
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium">
                <Trash2 size={16} />
                <span className="hidden sm:inline">ลบ</span>
              </button>
            </div>
          </div>

          {/* Status & Priority Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm ${getStatusStyle(
                ticket.status,
              )}`}
            >
              {ticket.status === "DONE" ? (
                <CheckCircle2 size={16} />
              ) : (
                <Clock size={16} />
              )}
              {ticket.status === "DONE"
                ? "เสร็จสิ้น"
                : ticket.status === "IN_PROGRESS"
                  ? "กำลังดำเนินการ"
                  : "เปิด"}
            </span>
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm ${getPriorityStyle(
                ticket.priority,
              )}`}
            >
              <AlertCircle size={16} />
              {ticket.priority === "HIGH"
                ? "ด่วน"
                : ticket.priority === "MEDIUM"
                  ? "ปานกลาง"
                  : "ต่ำ"}
            </span>
          </div>

          {/* Description */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={18} />
              รายละเอียด
            </h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4">ข้อมูลเพิ่มเติม</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  ประเภท
                </label>
                <p className="text-slate-900">{ticket.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  หมวดหมู่ปัญหา
                </label>
                <p className="text-slate-900">{ticket.problemCategory}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  ปัญหาย่อย
                </label>
                <p className="text-slate-900">{ticket.problemSubcategory}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  ชื่ออุปกรณ์
                </label>
                <p className="text-slate-900">{ticket.equipmentName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  สถานที่
                </label>
                <p className="text-slate-900">{ticket.location}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4">ข้อมูลบุคลากร</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-2">
                  <User size={16} className="inline mr-2" />
                  สร้างโดย
                </label>
                <p className="text-slate-900 font-medium">{ticket.user.name}</p>
                <p className="text-slate-500 text-sm">{ticket.user.email}</p>
              </div>
              {ticket.assignee && (
                <div>
                  <label className="text-sm font-medium text-slate-500 block mb-2">
                    <User size={16} className="inline mr-2" />
                    มอบหมายให้
                  </label>
                  <p className="text-slate-900 font-medium">
                    {ticket.assignee.name}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {ticket.assignee.email}
                  </p>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4">
                <label className="text-sm font-medium text-slate-500 block mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  วันที่สร้าง
                </label>
                <p className="text-slate-900">{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  แก้ไขล่าสุด
                </label>
                <p className="text-slate-900">{formatDate(ticket.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Paperclip size={18} />
              ไฟล์แนบ ({ticket.attachments.length})
            </h2>
            <div className="space-y-2">
              {ticket.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.fileUrl}
                  download
                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Paperclip
                    size={20}
                    className="text-slate-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                  <span className="text-indigo-600 text-sm font-medium flex-shrink-0">
                    ดาวน์โหลด
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Activity Logs Section */}
        {ticket.logs && ticket.logs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare size={18} />
              ประวัติการเปลี่ยนแปลง
            </h2>
            <div className="space-y-4">
              {ticket.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-4 pb-4 border-b border-slate-100 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">
                      {log.user.name}
                    </p>
                    <p className="text-slate-600 text-sm">{log.description}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
