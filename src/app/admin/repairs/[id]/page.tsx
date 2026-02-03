"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

type Status =
  | "PENDING"
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
          setTechnicians(res);
        }
      } catch (err) {
        console.error("Failed to fetch technicians:", err);
      }
    };
    fetchTechnicians();
  }, []);

  /* ---------------- Status Flow Validation ---------------- */
  // Define which statuses can transition to which
  const getAvailableStatuses = (
    currentStatus: Status,
  ): { value: Status; label: string; disabled: boolean }[] => {
    const allStatuses: { value: Status; label: string }[] = [
      { value: "PENDING", label: "รอดำเนินการ" },
      { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
      { value: "WAITING_PARTS", label: "รออะไหล่" },
      { value: "COMPLETED", label: "เสร็จสิ้น" },
      { value: "CANCELLED", label: "ยกเลิก" },
    ];

    // Status flow rules:
    // PENDING → can go to any status
    // IN_PROGRESS → cannot go back to PENDING
    // WAITING_PARTS → cannot go back to PENDING
    // COMPLETED → locked, cannot change
    // CANCELLED → locked, cannot change

    return allStatuses.map((s) => {
      let disabled = false;

      // If current status is COMPLETED or CANCELLED, disable all options except current
      if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
        disabled = s.value !== currentStatus;
      }
      // If current status is IN_PROGRESS or WAITING_PARTS, disable PENDING
      else if (
        currentStatus === "IN_PROGRESS" ||
        currentStatus === "WAITING_PARTS"
      ) {
        disabled = s.value === "PENDING";
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

  /* ---------------- Save ---------------- */
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

      router.push("/admin/repairs");
    } catch (err: any) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
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

            <Block title="ข้อมูลผู้แจ้ง">
              <Item label="ชื่อ" value={data.reporterName} />
              <Item label="แผนก" value={data.reporterDepartment} />
              <Item label="โทรศัพท์" value={data.reporterPhone} />
            </Block>
          </section>

          {/* RIGHT : ACTION */}
          <aside className="space-y-6">
            <Block title="การจัดการ">
              {/* Status with validation */}
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
                    className="w-full border border-zinc-300 rounded px-3 py-2 text-sm bg-white"
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
                {(data.status === "IN_PROGRESS" ||
                  data.status === "WAITING_PARTS") && (
                  <p className="text-xs text-amber-600">
                    ⚠️ ไม่สามารถย้อนกลับไปสถานะ "รอดำเนินการ" ได้
                  </p>
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

              {/* Multi-select Assignees */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">ผู้รับผิดชอบ</label>
                <div className="border border-zinc-200 rounded p-3 max-h-48 overflow-y-auto space-y-2">
                  {technicians.length === 0 ? (
                    <p className="text-sm text-zinc-400">ไม่พบรายชื่อช่าง</p>
                  ) : (
                    technicians.map((tech) => (
                      <label
                        key={tech.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={assigneeIds.includes(tech.id)}
                          onChange={() => toggleAssignee(tech.id)}
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
                {assigneeIds.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    เลือกแล้ว {assigneeIds.length} คน
                  </p>
                )}
              </div>
            </Block>

            <Block title="บันทึกการซ่อม">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="บันทึกขั้นตอนหรือผลการซ่อม..."
              />
            </Block>

            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-zinc-900 text-white text-sm py-2 rounded hover:bg-zinc-800"
              >
                บันทึก
              </button>
              <button
                onClick={() => router.back()}
                className="w-full border border-zinc-300 text-sm py-2 rounded"
              >
                ยกเลิก
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
