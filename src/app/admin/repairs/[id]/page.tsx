"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import { AuthService } from "@/lib/authService";
import Swal from "sweetalert2";

/* =====================================================
    Types & Constants
===================================================== */

type Status =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
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
  role: string;
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
  messageToReporter: string;
  estimatedCompletionDate: string;
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

export default function RepairDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Data states
  const [data, setData] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<User[]>([]);

  // User states
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [messageToReporter, setMessageToReporter] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [urgency, setUrgency] = useState<Urgency>("NORMAL");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  /* -------------------- Computed -------------------- */

  // Check if current user is assigned to this ticket
  const isAssignedToMe = currentUserId
    ? assigneeIds.includes(currentUserId)
    : false;

  // Determine if user can edit this ticket
  const canEdit = useCallback(() => {
    if (!data) return false;

    // Completed/Cancelled tickets are locked
    if (["COMPLETED", "CANCELLED"].includes(data.status)) return false;

    // Admin can always edit active tickets
    if (isAdmin) return true;

    // IT staff can only edit if assigned to them
    return isAssignedToMe && data.status !== "PENDING";
  }, [data, isAdmin, isAssignedToMe]);

  // Check if user can accept this job (IT staff with ASSIGNED status)
  const canAcceptJob = useCallback(() => {
    if (!data) return false;
    return data.status === "ASSIGNED" && isAssignedToMe;
  }, [data, isAssignedToMe]);

  // Check if user can assign technicians (Admin only, for PENDING tickets)
  const canAssign = useCallback(() => {
    if (!data) return false;
    return isAdmin && data.status === "PENDING";
  }, [data, isAdmin]);

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
          messageToReporter: res.messageToReporter || "",
          estimatedCompletionDate: res.estimatedCompletionDate || "",
          attachments: res.attachments || [],
          assignmentHistory: res.assignmentHistory || [],
        });

        setTitle(res.problemTitle);
        setDescription(res.problemDescription || "");
        setLocation(res.location);
        setStatus(res.status);
        setUrgency(res.urgency);
        setNotes(res.notes || "");
        setMessageToReporter(res.messageToReporter || "");
        setEstimatedCompletionDate(
          res.estimatedCompletionDate
            ? res.estimatedCompletionDate.split("T")[0]
            : "",
        );
        setAssigneeIds(assignees.map((a: Assignee) => a.userId));
      } catch {
        setError("ไม่สามารถโหลดข้อมูลงานซ่อมได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    const userId = AuthService.getUserId();
    const adminRole = AuthService.isAdmin();
    setCurrentUserId(userId);
    setIsAdmin(adminRole);

    const fetchTechnicians = async () => {
      try {
        const res = await apiFetch("/api/users/it-staff");
        if (Array.isArray(res)) {
          // Mark current user in the list
          const staff = res.map((u: User) => ({
            ...u,
            name: u.id === userId ? `${u.name} (คุณ)` : u.name,
          }));
          setTechnicians(staff);
        }
      } catch (err) {
        console.error("Failed to fetch technicians:", err);
      }
    };
    fetchTechnicians();
  }, []);

  // Auto-update status based on assignee selection (only for PENDING tickets)
  useEffect(() => {
    if (!data || data.status !== "PENDING") return;
    if (assigneeIds.length === 0) return;

    const adminIsAssigned = currentUserId
      ? assigneeIds.includes(currentUserId)
      : false;

    // If admin assigns ONLY themselves -> IN_PROGRESS
    // If admin assigns themselves + others OR just others -> ASSIGNED
    const newStatus =
      adminIsAssigned && assigneeIds.length === 1 ? "IN_PROGRESS" : "ASSIGNED";

    setStatus(newStatus);
  }, [assigneeIds, currentUserId, data]);

  /* -------------------- Actions -------------------- */

  const toggleAssignee = (userId: number) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSave = async () => {
    if (!data) return;

    const result = await Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: "บันทึกการเปลี่ยนแปลงทั้งหมด",
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

      // Auto-set status based on assignee
      let finalStatus = status;
      if (data.status === "PENDING" && assigneeIds.length > 0) {
        const adminIsAssigned = currentUserId
          ? assigneeIds.includes(currentUserId)
          : false;
        // If admin assigns ONLY themselves -> IN_PROGRESS
        // If admin assigns themselves + others OR just others -> ASSIGNED
        finalStatus =
          adminIsAssigned && assigneeIds.length === 1
            ? "IN_PROGRESS"
            : "ASSIGNED";
      }

      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          problemTitle: title,
          problemDescription: description,
          location: location,
          status: finalStatus,
          urgency,
          notes,
          messageToReporter,
          assigneeIds: assigneeIds,
        },
      });

      await Swal.fire({
        title: "บันทึกสำเร็จ!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.reload();
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

  const handleAssignJob = async () => {
    if (!data) return;
    if (assigneeIds.length === 0) {
      Swal.fire({
        title: "กรุณาเลือกผู้รับผิดชอบ",
        text: "ต้องเลือกอย่างน้อย 1 คน",
        icon: "warning",
      });
      return;
    }

    // Check if current user (Admin) is in the assignee list
    const adminIsAssigned = currentUserId
      ? assigneeIds.includes(currentUserId)
      : false;

    // If admin assigns ONLY themselves -> IN_PROGRES
    // If admin assigns themselves + others OR just others -> ASSIGNED
    const targetStatus =
      adminIsAssigned && assigneeIds.length === 1 ? "IN_PROGRESS" : "ASSIGNED";

    const confirmText =
      targetStatus === "IN_PROGRESS"
        ? "มอบหมายให้ตัวเองและเริ่มงานทันที"
        : adminIsAssigned
          ? `มอบหมายให้ ${assigneeIds.length} คน (รวมตัวคุณ) สถานะจะเป็น "มอบหมายแล้ว"`
          : `มอบหมายให้ ${assigneeIds.length} คน`;

    const result = await Swal.fire({
      title: "มอบหมายงาน?",
      text: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#18181b",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "มอบหมาย",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: targetStatus,
          assigneeIds: assigneeIds,
        },
      });

      await Swal.fire({
        title: "มอบหมายงานสำเร็จ!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.reload();
    } catch (err: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.message || "มอบหมายงานไม่สำเร็จ",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!data) return;

    const result = await Swal.fire({
      title: "รับงานนี้?",
      text: "สถานะจะเปลี่ยนเป็น 'กำลังดำเนินการ'",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "รับงาน",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "IN_PROGRESS",
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

  const handleStatusChange = async (newStatus: Status) => {
    if (!data) return;

    if (newStatus === data.status) return;

    const result = await Swal.fire({
      title: "ยืนยันการเปลี่ยนสถานะ?",
      text: `ต้องการเปลี่ยนสถานะเป็น "${STATUS_CONFIG[newStatus].label}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#18181b",
      cancelButtonColor: "#a1a1aa",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setSaving(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          problemTitle: title,
          problemDescription: description,
          location: location,
          status: newStatus,
          urgency,
          notes,
          messageToReporter,
          assigneeIds: assigneeIds,
        },
      });

      await Swal.fire({
        title: "บันทึกสำเร็จ!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.reload();
    } catch (err: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.message || "เปลี่ยนสถานะไม่สำเร็จ",
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
      { value: "PENDING", label: "รอรับงาน" },
      { value: "ASSIGNED", label: "มอบหมายแล้ว" },
      { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
      { value: "COMPLETED", label: "เสร็จสิ้น" },
      { value: "CANCELLED", label: "ยกเลิก" },
    ];

    // Define valid transitions
    const transitions: Record<Status, Status[]> = {
      PENDING: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["PENDING", "IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
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
            <div className="flex items-center gap-3">
              {/* Edit/Save/Cancel Buttons */}
              {!isLocked && canEdit() && (
                <>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => {
                          handleSave();
                          setIsEditing(false);
                        }}
                        disabled={saving}
                        className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      แก้ไขข้อมูล
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => router.back()}
                className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
              >
                ← ย้อนกลับ
              </button>
            </div>
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
            <button
              onClick={handleAcceptJob}
              disabled={saving}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              รับงาน
            </button>
          </div>
        )}

        {/* Locked Banner */}
        {isLocked && (
          <div className="bg-zinc-100 border border-zinc-300 rounded-lg p-4">
            <p className="text-sm text-zinc-600">
              งานนี้ถูกปิดแล้ว ไม่สามารถแก้ไขได้
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
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </Field>
                <Field label="สถานที่">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </Field>
                <Field label="รายละเอียดเพิ่มเติม">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="input-field"
                  />
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
            <Card title="ประวัติการดำเนินการ">
              {data.assignmentHistory && data.assignmentHistory.length > 0 ? (
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
              ) : (
                <p className="text-sm text-zinc-400">ยังไม่มีประวัติ</p>
              )}
            </Card>
          </section>

          {/* RIGHT: Actions */}
          <aside className="space-y-6">
            {/* Management Section */}
            <Card title="การจัดการงาน">
              <div className="space-y-4">
                {/* Assignees */}
                <Field label="ผู้รับผิดชอบ">
                  <div className="border border-zinc-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 bg-white">
                    {technicians.length === 0 ? (
                      <p className="text-sm text-zinc-400 p-2">
                        ไม่พบรายชื่อ IT
                      </p>
                    ) : (
                      technicians.map((tech) => (
                        <label
                          key={tech.id}
                          className={`flex items-center gap-2 p-2 rounded ${
                            canEdit() || data.status === "PENDING"
                              ? "hover:bg-zinc-50 cursor-pointer"
                              : "cursor-default"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={assigneeIds.includes(tech.id)}
                            onChange={() => toggleAssignee(tech.id)}
                            disabled={!canEdit() && data.status !== "PENDING"}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 disabled:opacity-50"
                          />
                          <span className="text-sm text-zinc-700">
                            {tech.name}
                          </span>
                          <span className="text-xs text-zinc-400">
                            ({tech.role})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {assigneeIds.length > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-2">
                      ✓ เลือกแล้ว {assigneeIds.length} คน
                    </p>
                  )}
                </Field>

                {/* Status */}
                {/* <Field label="สถานะ">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    {isLocked && (
                      <span className="text-xs text-zinc-400">(ล็อค)</span>
                    )}
                  </div> */}
                  {/* Status hint based on assignee selection */}
                  {/* {data.status === "PENDING" && assigneeIds.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      💡 สถานะจะเปลี่ยนเป็น "{STATUS_CONFIG[status].label}"
                      หลังกดมอบหมาย
                    </p>
                  )} */}
                {/* </Field> */}

                {/* Action Buttons */}
                {!isLocked && canEdit() && (
                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    {/* Complete Button - only for IN_PROGRESS */}
                    {data.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleStatusChange("COMPLETED")}
                        disabled={saving}
                        className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        เสร็จสิ้นงาน
                      </button>
                    )}
                    {/* Cancel Button - for non-completed tickets */}
                    {!["COMPLETED", "CANCELLED"].includes(data.status) && (
                      <button
                        onClick={() => handleStatusChange("CANCELLED")}
                        disabled={saving}
                        className="w-full py-2.5 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        ยกเลิกงาน
                      </button>
                    )}
                  </div>
                )}

                {/* Urgency */}
                <Field label="ความเร่งด่วน">
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as Urgency)}
                    disabled={!canEdit()}
                    className="input-field"
                  >
                    <option value="NORMAL">ปกติ</option>
                    <option value="URGENT">ด่วน</option>
                    <option value="CRITICAL">ด่วนมาก</option>
                  </select>
                </Field>
              </div>
            </Card>

            {/* Message to Reporter Section */}
            <Card title="ข้อความถึงผู้แจ้ง">
              <textarea
                value={messageToReporter}
                onChange={(e) => setMessageToReporter(e.target.value)}
                rows={3}
                disabled={!canEdit()}
                className="input-field"
                placeholder={
                  canEdit() ? "พิมพ์ข้อความที่ต้องการส่งถึงผู้แจ้ง..." : ""
                }
              />
              <p className="text-xs text-zinc-400 mt-2">
                ข้อความนี้จะถูกส่งไปยังผู้แจ้งผ่าน LINE เมื่อบันทึก
              </p>
            </Card>

            {/* Internal Notes Section */}
            <Card title="บันทึกภายใน (ไม่ส่งถึงผู้แจ้ง)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                disabled={!canEdit()}
                className="input-field"
                placeholder={
                  canEdit()
                    ? "บันทึกขั้นตอนหรือผลการซ่อม (สำหรับทีมงาน)..."
                    : ""
                }
              />
            </Card>

            {/* Action Buttons */}
            {!isLocked && (
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !canEdit()}
                  className="w-full bg-zinc-900 text-white py-2.5 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
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
