"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import { AuthService } from "@/lib/authService";

const actionMapping: Record<string, string> = {
  ASSIGN: "มอบหมายงาน",
  UNASSIGN: "ยกเลิกการมอบหมาย",
  ACCEPT: "รับงาน",
  REJECT: "ปฏิเสธงาน",
  STATUS_CHANGE: "เปลี่ยนสถานะ",
};

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
  attachments: Attachment[];
  assignmentHistory: HistoryLog[];
}

export default function RepairDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<User[]>([]);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [urgency, setUrgency] = useState<Urgency>("NORMAL");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  /* ---------------- Fetch ---------------- */
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
    const fetchTechnicians = async () => {
      try {
        const res = await apiFetch("/api/users/it-staff");
        if (Array.isArray(res)) {
          let staff = res;
          const currentUserId = AuthService.getUserId();

          // Helper: Make sure we have the current user in the list if they intend to assign to themselves
          // (Even if backend logic excluded them for some reason)
          if (
            currentUserId &&
            !staff.find((u: User) => u.id === currentUserId)
          ) {
            try {
              const me = await apiFetch(`/api/users/${currentUserId}`);
              if (me && me.role) {
                staff.push(me);
              }
            } catch (e) {
              console.warn("Could not fetch current user details", e);
            }
          }

          // Mark current user
          staff = staff.map((u: User) => ({
            ...u,
            name: u.id === currentUserId ? `${u.name} (คุณ)` : u.name,
          }));

          setTechnicians(staff);
        }
      } catch (err) {
        console.error("Failed to fetch technicians:", err);
      }
    };
    fetchTechnicians();
  }, []);

  const getAvailableStatuses = (
    currentStatus: Status,
  ): { value: Status; label: string; disabled: boolean }[] => {
    const allStatuses: { value: Status; label: string }[] = [
      { value: "PENDING", label: "รอรับงาน" },
      { value: "ASSIGNED", label: "มอบหมายแล้ว (รอตอบรับ)" },
      { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
      { value: "COMPLETED", label: "เสร็จสิ้น" },
      { value: "CANCELLED", label: "ยกเลิก" },
    ];

    return allStatuses.map((s) => {
      let disabled = false;

      // Logic locks could be refined here based on state transitions
      // For now allow Admin to force change mostly, but respect completed state
      if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
        disabled = s.value !== currentStatus;
      }

      return { ...s, disabled };
    });
  };

  const availableStatuses = data ? getAvailableStatuses(data.status) : [];

  /* ---------------- Assignee Toggle ---------------- */
  const toggleAssignee = (userId: number) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  /* ---------------- Save ----------------*/
  const handleSave = async () => {
    if (!data) return;

    try {
      setLoading(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          problemTitle: title,
          problemDescription: description,
          location: location,
          status,
          urgency,
          notes,
          assigneeIds: assigneeIds,
        },
      });

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!data) return;
    if (
      !confirm("ต้องการรับงานนี้ใช่หรือไม่? สถานะจะเปลี่ยนเป็นกำลังดำเนินการ")
    )
      return;

    try {
      setLoading(true);

      const currentUserId = AuthService.getUserId();
      let newAssigneeIds = [...assigneeIds];

      if (currentUserId && !newAssigneeIds.includes(currentUserId)) {
        newAssigneeIds.push(currentUserId);
      }

      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "IN_PROGRESS",
          assigneeIds: newAssigneeIds,
        },
      });

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการรับงาน");
    } finally {
      setLoading(false);
    }
  };

  const handleDelegateJob = async () => {
    if (!data) return;
    if (assigneeIds.length === 0) {
      alert("กรุณาเลือกผู้รับผิดชอบอย่างน้อย 1 คน");
      return;
    }
    if (!confirm(`ต้องการมอบหมายงานให้ ${assigneeIds.length} คน ใช่หรือไม่?`))
      return;

    try {
      setLoading(true);

      // CHANGE: Set status to ASSIGNED instead of IN_PROGRESS
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "ASSIGNED",
          assigneeIds: assigneeIds,
        },
      });

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการมอบหมายงาน");
    } finally {
      setLoading(false);
    }
  };

  if (!data && loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-zinc-500">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!data) return null;

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900">
            งานซ่อม #{data.ticketCode}
          </h1>
          <p className="text-sm text-zinc-500">
            แจ้งเมื่อ {new Date(data.createdAt).toLocaleString("th-TH")}
          </p>
        </header>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT : READ */}
          <section className="lg:col-span-2 space-y-6">
            <Block title="แก้ไขรายละเอียดปัญหา">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">หัวข้อปัญหา</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">สถานที่</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </Block>
            <Block title="ข้อมูลผู้แจ้ง">
              <Item label="ชื่อ" value={data.reporterName} />
              <Item label="แผนก" value={data.reporterDepartment} />
              <Item label="โทรศัพท์" value={data.reporterPhone} />
            </Block>

            <Block title="ประวัติการมอบหมายงาน">
              {data.assignmentHistory && data.assignmentHistory.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {data.assignmentHistory.map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex justify-between items-start text-sm"
                    >
                      <div>
                        <div className="font-medium text-zinc-900">
                          {actionMapping[log.action] || log.action}
                        </div>
                        <div className="text-zinc-500 text-xs">
                          {log.assignee?.name} (โดย {log.assigner?.name})
                        </div>
                        {log.note && (
                          <div className="text-zinc-600 mt-1">{log.note}</div>
                        )}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-400 py-2">
                  ไม่มีประวัติการมอบหมาย
                </div>
              )}
            </Block>

            {data.attachments && data.attachments.length > 0 && (
              <Block title="รูปภาพประกอบ">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square relative rounded-lg overflow-hidden border border-zinc-200 group"
                    >
                      <img
                        src={file.fileUrl}
                        alt={file.filename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </a>
                  ))}
                </div>
              </Block>
            )}

            
          </section>

          {/* RIGHT : ACTION */}
          <aside className="space-y-6">
            {/* Step 1: Assign (only for PENDING) */}
            {data.status === "PENDING" && (
              <Block title="ขั้นตอนที่ 1: มอบหมายงาน / รับงาน">
                <div className="space-y-4">
                  {/* Technician List Selection */}
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500">
                      เลือกผู้รับผิดชอบ (สามารถเลือกหลายคน)
                    </label>
                    <div className="border border-zinc-200 rounded p-2 max-h-48 overflow-y-auto space-y-1 bg-white">
                      {technicians.length === 0 ? (
                        <p className="text-sm text-zinc-400">ไม่พบรายชื่อ IT</p>
                      ) : (
                        technicians.map((tech) => (
                          <label
                            key={tech.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-1 rounded text-sm transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={assigneeIds.includes(tech.id)}
                              onChange={() => toggleAssignee(tech.id)}
                              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <span className="text-zinc-700">{tech.name}</span>
                            <span className="text-xs text-zinc-400">
                              ({tech.role})
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-500">
                        * หากกด "รับงานเอง"
                        ระบบจะเพิ่มคุณเป็นผู้รับผิดชอบโดยอัตโนมัติ
                      </p>
                      {assigneeIds.length > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ เลือกแล้ว {assigneeIds.length} คน
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleAcceptJob}
                      disabled={loading}
                      className="bg-blue-600 text-white text-sm font-bold py-2.5 rounded shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      รับงานเอง
                      {assigneeIds.length > 0 && " (+ ทีมที่เลือก)"}
                    </button>

                    <button
                      onClick={handleDelegateJob}
                      disabled={loading || assigneeIds.length === 0}
                      className="bg-orange-500 text-white text-sm font-bold py-2.5 rounded shadow hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      มอบหมายงาน
                    </button>
                  </div>
                </div>
              </Block>
            )}

            {/* Step 2: Management (after accepting) */}
            <Block
              title={
                data.status === "PENDING"
                  ? "ขั้นตอนที่ 2: จัดการงาน (รับงานก่อน)"
                  : "การจัดการงาน"
              }
            >
              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">สถานะ</label>
                {data.status === "COMPLETED" || data.status === "CANCELLED" ? (
                  <div className="w-full border border-zinc-200 rounded px-3 py-2 text-sm bg-zinc-100 text-zinc-500">
                    {availableStatuses.find((s) => s.value === status)?.label ||
                      status}
                    <span className="ml-2 text-xs">(ล็อค)</span>
                  </div>
                ) : (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    disabled={data.status === "PENDING"}
                    className={`w-full border border-zinc-300 rounded px-3 py-2 text-sm bg-white ${data.status === "PENDING" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {availableStatuses.map((s) => (
                      <option
                        key={s.value}
                        value={s.value}
                        disabled={s.disabled}
                      >
                        {s.label} {s.disabled ? "(ไม่สามารถย้อนกลับ)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Select
                label="ความเร่งด่วน"
                value={urgency}
                onChange={setUrgency}
              >
                <option value="NORMAL">ปกติ</option>
                <option value="URGENT">ด่วน</option>
                <option value="CRITICAL">ด่วนมาก</option>
              </Select>

              {/* Multi-select Assignees with dynamic label */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">
                  {assigneeIds.length > 0
                    ? "แก้ไขผู้รับผิดชอบ"
                    : "มอบหมายผู้รับผิดชอบ"}
                </label>
                <div
                  className={`border border-zinc-200 rounded p-3 max-h-48 overflow-y-auto space-y-2 ${data.status === "PENDING" ? "opacity-50" : ""}`}
                >
                  {technicians.length === 0 ? (
                    <p className="text-sm text-zinc-400">ไม่พบรายชื่อช่าง</p>
                  ) : (
                    technicians.map((tech) => (
                      <label
                        key={tech.id}
                        className={`flex items-center gap-2 p-1 rounded ${data.status === "PENDING" ? "cursor-not-allowed" : "cursor-pointer hover:bg-zinc-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={assigneeIds.includes(tech.id)}
                          onChange={() => toggleAssignee(tech.id)}
                          disabled={data.status === "PENDING"}
                          className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
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
              </div>
            </Block>

            {/* Step 3: Repair Notes */}
            <Block
              title={
                data.status === "PENDING"
                  ? "ขั้นตอนที่ 3: บันทึกการซ่อม (รับงานก่อน)"
                  : "บันทึกการซ่อม"
              }
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                disabled={data.status === "PENDING"}
                className={`w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 ${data.status === "PENDING" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder={
                  data.status === "PENDING"
                    ? "กรุณากดรับงานก่อนเริ่มบันทึกการซ่อม"
                    : "บันทึกขั้นตอนหรือผลการซ่อม..."
                }
              />
            </Block>

            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={loading || data.status === "PENDING"}
                className={`w-full text-white text-sm py-2 rounded transition-colors ${loading || data.status === "PENDING" ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800"}`}
              >
                บันทึก
              </button>
              <button
                onClick={() => router.back()}
                className="w-full border border-zinc-300 text-sm py-2 rounded"
              >
                ย้อนกลับ
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-200 rounded p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </div>
  );
}

function Item({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="text-sm">
      <div className="text-zinc-500 mb-1">{label}</div>
      <div
        className={`text-zinc-900 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: any) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm bg-white"
      >
        {children}
      </select>
    </div>
  );
}
