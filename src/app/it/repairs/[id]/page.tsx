"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import Swal from "sweetalert2";

/* =====================================================
    Types & Constants
===================================================== */

type Status =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "COMPLETED"
  | "CANCELLED";

type Urgency = "NORMAL" | "URGENT" | "CRITICAL";

interface Attachment {
  id: number;
  fileUrl: string;
  filename: string;
}

interface User {
  id: number;
  name: string;
}

interface Assignee {
  id: number;
  userId: number;
  user: User;
}

interface HistoryLog {
  id: number;
  action: string;
  assigner: User;
  assignee: User;
  note: string;
  createdAt: string;
}

interface RepairDetail {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: Status;
  urgency: Urgency;
  assignees: Assignee[];
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  createdAt: string;
  notes: string;
  attachments: Attachment[];
  assignmentHistory: HistoryLog[];
}

const STATUS_CONFIG: Record<
  Status,
  { bg: string; text: string; label: string }
> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "รอรับงาน" },
  ASSIGNED: { bg: "bg-blue-100", text: "text-blue-800", label: "มอบหมายแล้ว" },
  IN_PROGRESS: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "กำลังดำเนินการ",
  },
  WAITING_PARTS: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "รออะไหล่",
  },
  COMPLETED: { bg: "bg-green-100", text: "text-green-800", label: "เสร็จสิ้น" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "ยกเลิก" },
};

const URGENCY_CONFIG: Record<
  Urgency,
  { bg: string; text: string; label: string }
> = {
  NORMAL: { bg: "bg-gray-100", text: "text-gray-700", label: "ปกติ" },
  URGENT: { bg: "bg-amber-100", text: "text-amber-700", label: "ด่วน" },
  CRITICAL: { bg: "bg-red-100", text: "text-red-700", label: "ด่วนมาก" },
};

const ACTION_LABELS: Record<string, string> = {
  ASSIGN: "มอบหมายงาน",
  UNASSIGN: "ยกเลิกการมอบหมาย",
  ACCEPT: "รับงาน",
  REJECT: "ปฏิเสธงาน",
  STATUS_CHANGE: "เปลี่ยนสถานะ",
};

/* =====================================================
    Main Component
===================================================== */

export default function ITRepairDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Data states
  const [data, setData] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // User states
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [urgency, setUrgency] = useState<Urgency>("NORMAL");

  /* -------------------- Computed -------------------- */

  // Check if current user is assigned to this ticket
  const isAssignedToMe = useCallback(() => {
    if (!data || !currentUserId) return false;
    return data.assignees?.some(
      (a) => a.userId === currentUserId || a.user?.id === currentUserId,
    );
  }, [data, currentUserId]);

  // Check if user can edit (assigned to them and IN_PROGRESS or later)
  const canEdit = useCallback(() => {
    if (!data) return false;
    if (["COMPLETED", "CANCELLED"].includes(data.status)) return false;
    if (!isAssignedToMe()) return false;
    return !["PENDING", "ASSIGNED"].includes(data.status);
  }, [data, isAssignedToMe]);

  // Check if user can accept this job (ASSIGNED status)
  const canAcceptJob = useCallback(() => {
    if (!data) return false;
    return data.status === "ASSIGNED" && isAssignedToMe();
  }, [data, isAssignedToMe]);

  // Check if this is an unassigned job they can pick up
  const canPickupJob = useCallback(() => {
    if (!data) return false;
    return data.status === "PENDING" && (data.assignees?.length || 0) === 0;
  }, [data]);

  /* -------------------- Init User -------------------- */
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
  }, []);

  /* -------------------- Fetch Data -------------------- */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/repairs/${id}`);
        const assignees = res.assignees || [];

        setData({
          id: res.id,
          ticketCode: res.ticketCode,
          title: res.problemTitle,
          description: res.problemDescription,
          category: res.problemCategory,
          location: res.location,
          status: res.status,
          urgency: res.urgency,
          assignees: assignees,
          reporterName: res.reporterName,
          reporterDepartment: res.reporterDepartment,
          reporterPhone: res.reporterPhone,
          createdAt: res.createdAt,
          notes: res.notes || "",
          attachments: res.attachments || [],
          assignmentHistory: res.assignmentHistory || [],
        });

        setTitle(res.problemTitle);
        setDescription(res.problemDescription || "");
        setLocation(res.location);
        setStatus(res.status);
        setUrgency(res.urgency);
        setNotes(res.notes || "");
      } catch {
        setError("ไม่สามารถโหลดข้อมูลงานซ่อมได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* -------------------- Actions -------------------- */

  const handleAcceptJob = async () => {
    if (!data) return;

    const { value: messageToReporter } = await Swal.fire({
      title: "รับงานนี้?",
      text: "คุณสามารถส่งข้อความถึงผู้แจ้งได้ (ถ้ามี)",
      icon: "question",
      input: "textarea",
      inputPlaceholder: "พิมพ์ข้อความถึงผู้แจ้งที่นี่...",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "รับงาน",
      cancelButtonText: "ยกเลิก",
    });

    if (messageToReporter === undefined) return; // User clicked "Cancel"

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "IN_PROGRESS",
          messageToReporter: messageToReporter || "",
        },
      });

      await Swal.fire({
        title: "รับงานสำเร็จ!",
        text: "คุณสามารถเริ่มดำเนินการได้เลย",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.reload();
    } catch (err: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.message || "รับงานไม่สำเร็จ",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePickupJob = async () => {
    if (!data || !currentUserId) return;

    const { value: messageToReporter } = await Swal.fire({
      title: "รับงานซ่อมนี้?",
      text: "คุณจะถูกมอบหมายเป็นผู้รับผิดชอบ และสามารถส่งข้อความถึงผู้แจ้งได้",
      icon: "question",
      input: "textarea",
      inputPlaceholder: "พิมพ์ข้อความถึงผู้แจ้งที่นี่...",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "รับงาน",
      cancelButtonText: "ยกเลิก",
    });

    if (messageToReporter === undefined) return;

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          assigneeIds: [currentUserId],
          status: "IN_PROGRESS",
          messageToReporter: messageToReporter || "",
        },
      });

      await Swal.fire({
        title: "รับงานสำเร็จ!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.reload();
    } catch (err: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.message || "รับงานไม่สำเร็จ",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRejectJob = async () => {
    if (!data) return;

    const { value: reason } = await Swal.fire({
      title: "ปฏิเสธงาน",
      input: "textarea",
      inputLabel: "กรุณาระบุเหตุผล",
      inputPlaceholder: "เหตุผลที่ปฏิเสธ...",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "ปฏิเสธงาน",
      cancelButtonText: "ยกเลิก",
      inputValidator: (value) => {
        if (!value) {
          return "กรุณาระบุเหตุผล";
        }
        return null;
      },
    });

    if (!reason) return;

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "PENDING",
          notes: data.notes + `\n[ปฏิเสธงานโดย IT]: ${reason}`,
        },
      });

      await Swal.fire({
        title: "ปฏิเสธงานแล้ว",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/it/repairs");
    } catch (err: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ปฏิเสธงานไม่สำเร็จ",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    const result = await Swal.fire({
      title: "บันทึกการเปลี่ยนแปลง?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#18181b",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          problemTitle: title,
          problemDescription: description,
          location: location,
          status,
          urgency,
          notes,
        },
      });

      await Swal.fire({
        title: "บันทึกสำเร็จ!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/it/repairs");
    } catch (err: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.message || "บันทึกข้อมูลไม่สำเร็จ",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------- Available Statuses -------------------- */

  const getAvailableStatuses = (): {
    value: Status;
    label: string;
    disabled: boolean;
  }[] => {
    if (!data) return [];

    const allStatuses: { value: Status; label: string }[] = [
      { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
      { value: "WAITING_PARTS", label: "รออะไหล่" },
      { value: "COMPLETED", label: "เสร็จสิ้น" },
      { value: "CANCELLED", label: "ยกเลิก" },
    ];

    // IT staff can only change to these statuses
    const transitions: Record<Status, Status[]> = {
      PENDING: [],
      ASSIGNED: ["IN_PROGRESS"],
      IN_PROGRESS: ["WAITING_PARTS", "COMPLETED", "CANCELLED"],
      WAITING_PARTS: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = transitions[data.status] || [];

    return allStatuses.map((s) => ({
      ...s,
      disabled: s.value !== data.status && !allowed.includes(s.value),
    }));
  };

  /* -------------------- Loading State -------------------- */

  if (!data && loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-3"></div>
          <p className="text-sm text-zinc-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isLocked = ["COMPLETED", "CANCELLED"].includes(data.status);

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <header className="bg-white rounded-lg border border-zinc-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-zinc-900">
                  #{data.ticketCode}
                </h1>
                <StatusBadge status={data.status} />
                <UrgencyBadge urgency={data.urgency} />
              </div>
              <p className="text-sm text-zinc-500">
                แจ้งเมื่อ {new Date(data.createdAt).toLocaleString("th-TH")}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              ← ย้อนกลับ
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Accept Job Banner */}
        {canAcceptJob() && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-purple-900">
                งานนี้ถูกมอบหมายให้คุณ
              </p>
              <p className="text-sm text-purple-700">
                กดรับงานเพื่อเริ่มดำเนินการ
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRejectJob}
                disabled={saving}
                className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                ปฏิเสธ
              </button>
              <button
                onClick={handleAcceptJob}
                disabled={saving}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                รับงาน
              </button>
            </div>
          </div>
        )}

        {/* Pickup Job Banner */}
        {canPickupJob() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                งานนี้ยังไม่มีผู้รับผิดชอบ
              </p>
              <p className="text-sm text-blue-700">คุณสามารถรับงานนี้ได้</p>
            </div>
            <button
              onClick={handlePickupJob}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              รับงาน
            </button>
          </div>
        )}

        {/* Locked Banner */}
        {isLocked && (
          <div className="bg-zinc-100 border border-zinc-300 rounded-lg p-4">
            <p className="text-sm text-zinc-600">
              🔒 งานนี้ถูกปิดแล้ว ไม่สามารถแก้ไขได้
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Details */}
          <section className="lg:col-span-2 space-y-6">
            {/* Problem Details */}
            <Card title="รายละเอียดปัญหา">
              <div className="space-y-4">
                <Field label="หัวข้อปัญหา">
                  {canEdit() ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-sm text-zinc-900 font-medium">
                      {data.title}
                    </p>
                  )}
                </Field>
                <Field label="สถานที่">
                  {canEdit() ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-sm text-zinc-900">{data.location}</p>
                  )}
                </Field>
                <Field label="รายละเอียดเพิ่มเติม">
                  {canEdit() ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-sm text-zinc-900 whitespace-pre-wrap">
                      {data.description || "-"}
                    </p>
                  )}
                </Field>
              </div>
            </Card>

            {/* Reporter Info */}
            <Card title="ข้อมูลผู้แจ้ง">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ReadOnlyField label="ชื่อ" value={data.reporterName} />
                <ReadOnlyField label="แผนก" value={data.reporterDepartment} />
                <ReadOnlyField label="โทรศัพท์" value={data.reporterPhone} />
              </div>
            </Card>

            {/* Attachments */}
            {data.attachments && data.attachments.length > 0 && (
              <Card title="รูปภาพประกอบ">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-colors"
                    >
                      <img
                        src={file.fileUrl}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* History */}
            {data.assignmentHistory && data.assignmentHistory.length > 0 && (
              <Card title="ประวัติการดำเนินการ">
                <div className="divide-y divide-zinc-100">
                  {data.assignmentHistory.map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex justify-between items-start"
                    >
                      <div>
                        <p className="font-medium text-zinc-900 text-sm">
                          {ACTION_LABELS[log.action] || log.action}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {log.assignee?.name && `${log.assignee.name} `}
                          {log.assigner?.name && `(โดย ${log.assigner.name})`}
                        </p>
                        {log.note && (
                          <p className="text-xs text-zinc-600 mt-1">
                            {log.note}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </section>

          {/* RIGHT: Actions */}
          <aside className="space-y-6">
            {/* Management Section */}
            <Card title="การจัดการงาน">
              <div className="space-y-4">
                {/* Status */}
                <Field label="สถานะ">
                  {canEdit() ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Status)}
                      className="input-field"
                    >
                      {getAvailableStatuses().map((s) => (
                        <option
                          key={s.value}
                          value={s.value}
                          disabled={s.disabled}
                        >
                          {s.label} {s.disabled ? "(ไม่สามารถเลือก)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={data.status} />
                    </div>
                  )}
                </Field>

                {/* Urgency */}
                <Field label="ความเร่งด่วน">
                  {canEdit() ? (
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as Urgency)}
                      className="input-field"
                    >
                      <option value="NORMAL">ปกติ</option>
                      <option value="URGENT">ด่วน</option>
                      <option value="CRITICAL">ด่วนมาก</option>
                    </select>
                  ) : (
                    <p className="text-sm text-zinc-900">
                      {URGENCY_CONFIG[data.urgency].label}
                    </p>
                  )}
                </Field>

                {/* Assignees (Read Only) */}
                <Field label="ผู้รับผิดชอบ">
                  <p className="text-sm text-zinc-900">
                    {data.assignees && data.assignees.length > 0
                      ? data.assignees
                          .map((a) => a.user?.name || "Unknown")
                          .join(", ")
                      : "ยังไม่มีผู้รับงาน"}
                  </p>
                </Field>
              </div>
            </Card>

            {/* Notes Section */}
            <Card title="บันทึกการซ่อม">
              {canEdit() ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  className="input-field"
                  placeholder="บันทึกขั้นตอนหรือผลการซ่อม..."
                />
              ) : (
                <p className="text-sm text-zinc-900 whitespace-pre-wrap">
                  {data.notes || "-"}
                </p>
              )}
            </Card>

            {/* Action Buttons */}
            {canEdit() && !isLocked && (
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-zinc-900 text-white py-2.5 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .input-field {
          width: 100%;
          border: 1px solid #e4e4e7;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          transition: all 0.15s;
        }
        .input-field:focus {
          outline: none;
          border-color: #18181b;
          box-shadow: 0 0 0 1px #18181b;
        }
        .input-field:disabled {
          background: #f4f4f5;
          color: #71717a;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

/* =====================================================
    UI Components
===================================================== */

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const config = URGENCY_CONFIG[urgency];
  if (urgency === "NORMAL") return null;
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-zinc-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-zinc-900">{value || "-"}</p>
    </div>
  );
}
