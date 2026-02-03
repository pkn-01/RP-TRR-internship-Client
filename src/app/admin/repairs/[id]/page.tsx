"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

/* ---------------- Types ---------------- */

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

/* ---------------- Status Flow ---------------- */

const STATUS_LABEL: Record<Status, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  WAITING_PARTS: "รออะไหล่",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

const STATUS_FLOW: Record<Status, Status[]> = {
  PENDING: ["IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_PARTS", "COMPLETED", "CANCELLED"],
  WAITING_PARTS: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/* ---------------- Page ---------------- */

export default function RepairDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<User[]>([]);

  /* Editable states */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [urgency, setUrgency] = useState<Urgency>("NORMAL");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  /* ---------------- Fetch Detail ---------------- */

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/repairs/${id}`);

        const assignees = res.assignees || [];

        const detail: RepairDetail = {
          id: res.id,
          ticketCode: res.ticketCode,
          title: res.problemTitle,
          description: res.problemDescription || "",
          category: res.problemCategory,
          location: res.location,
          status: res.status,
          urgency: res.urgency,
          assignees,
          reporterName: res.reporterName,
          reporterDepartment: res.reporterDepartment,
          reporterPhone: res.reporterPhone,
          createdAt: res.createdAt,
          notes: res.notes || "",
          attachments: res.attachments || [],
        };

        setData(detail);

        setTitle(detail.title);
        setDescription(detail.description);
        setLocation(detail.location);
        setStatus(detail.status);
        setUrgency(detail.urgency);
        setNotes(detail.notes);
        setAssigneeIds(assignees.map((a: Assignee) => a.userId));
      } catch {
        setError("ไม่สามารถโหลดข้อมูลงานซ่อมได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* ---------------- Fetch Technicians ---------------- */

  useEffect(() => {
    apiFetch("/api/users/it-staff")
      .then((res) => Array.isArray(res) && setTechnicians(res))
      .catch(() => {});
  }, []);

  /* ---------------- Status Options ---------------- */

  const availableStatuses = useMemo(() => {
    return (Object.keys(STATUS_LABEL) as Status[]).map((s) => ({
      value: s,
      label: STATUS_LABEL[s],
      disabled:
        status !== s &&
        (status === "COMPLETED" ||
          status === "CANCELLED" ||
          !STATUS_FLOW[status].includes(s)),
    }));
  }, [status]);

  /* ---------------- Helpers ---------------- */

  const toggleAssignee = (userId: number) => {
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const hasChanges =
    data &&
    (title !== data.title ||
      description !== data.description ||
      location !== data.location ||
      status !== data.status ||
      urgency !== data.urgency ||
      notes !== data.notes ||
      assigneeIds.sort().join() !==
        data.assignees.map((a) => a.userId).sort().join());

  /* ---------------- Save ---------------- */

  const handleSave = async () => {
    if (!data || !hasChanges) return;

    if (
      status === "IN_PROGRESS" &&
      assigneeIds.length === 0
    ) {
      setError("สถานะกำลังดำเนินการ ต้องมีผู้รับผิดชอบอย่างน้อย 1 คน");
      return;
    }

    if (status === "COMPLETED" && !notes.trim()) {
      setError("กรุณาบันทึกรายละเอียดการซ่อมก่อนปิดงาน");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          problemTitle: title,
          problemDescription: description,
          location,
          status,
          urgency,
          notes,
          assigneeIds,
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
        <header>
          <h1 className="text-xl font-semibold">
            งานซ่อม #{data.ticketCode}
          </h1>
          <p className="text-sm text-zinc-500">
            แจ้งเมื่อ {new Date(data.createdAt).toLocaleString("th-TH")}
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <section className="lg:col-span-2 space-y-6">
            <Block title="แก้ไขรายละเอียดปัญหา">
              <Input label="หัวข้อปัญหา" value={title} onChange={setTitle} />
              <Input label="สถานที่" value={location} onChange={setLocation} />
              <Textarea
                label="รายละเอียดเพิ่มเติม"
                value={description}
                onChange={setDescription}
              />
            </Block>
          </section>

          {/* RIGHT */}
          <aside className="space-y-6">
            <Block title="การจัดการ">
              <Select
                label="สถานะ"
                value={status}
                onChange={setStatus}
                disabled={status === "COMPLETED" || status === "CANCELLED"}
              >
                {availableStatuses.map((s) => (
                  <option key={s.value} value={s.value} disabled={s.disabled}>
                    {s.label}
                  </option>
                ))}
              </Select>

              <Select
                label="ความเร่งด่วน"
                value={urgency}
                onChange={setUrgency}
              >
                <option value="NORMAL">ปกติ</option>
                <option value="URGENT">ด่วน</option>
                <option value="CRITICAL">ด่วนมาก</option>
              </Select>
            </Block>

            <Block title="บันทึกการซ่อม">
              <Textarea value={notes} onChange={setNotes} />
            </Block>

            <button
              disabled={!hasChanges || loading}
              onClick={handleSave}
              className="w-full bg-zinc-900 text-white py-2 rounded disabled:opacity-40"
            >
              บันทึก
            </button>
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
    <div className="border rounded p-5 space-y-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      {label && <label className="text-xs text-zinc-500">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full border rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: any) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
