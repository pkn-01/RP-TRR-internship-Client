"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

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

interface RepairDetail {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: Status;
  urgency: Urgency;
  assignees: { id: number; name: string }[];
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  createdAt: string;
  notes: string;
  attachments: Attachment[];
}

export default function ITRepairDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Current User State
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [urgency, setUrgency] = useState<Urgency>("NORMAL");

  /* ---------------- Init User ---------------- */
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
  }, []);

  /* ---------------- Fetch ---------------- */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/repairs/${id}`);

        setData({
          id: res.id,
          ticketCode: res.ticketCode,
          title: res.problemTitle,
          description: res.problemDescription,
          category: res.problemCategory,
          location: res.location,
          status: res.status,
          urgency: res.urgency,
          assignees:
            res.assignees?.map((a: any) => ({
              id: a.user.id,
              name: a.user.name,
            })) || [],
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
      } catch {
        setError("ไม่สามารถโหลดข้อมูลงานซ่อมได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* ---------------- Computed ---------------- */
  const isAssigned = (data?.assignees?.length || 0) > 0;
  const isMyJob =
    currentUserId !== null &&
    data?.assignees?.some((a) => a.id === currentUserId);
  const canEdit =
    isMyJob && data?.status !== "ASSIGNED" && data?.status !== "PENDING";

  /* ---------------- Actions ---------------- */
  const handleAcceptJob = async () => {
    if (!data || !currentUserId) return;
    if (!window.confirm("ต้องการรับงานซ่อมนี้ใช่หรือไม่?")) return;

    try {
      setLoading(true);
      // Status change to IN_PROGRESS (logs ACCEPT)
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "IN_PROGRESS",
        },
      });

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "รับงานไม่สำเร็จ");
      setLoading(false);
    }
  };

  const handleRejectJob = async () => {
    if (!data || !currentUserId) return;
    const reason = prompt("กรุณาระบุเหตุผลที่ปฏิเสธงาน:");
    if (reason === null) return;

    try {
      setLoading(true);
      // Status change to PENDING (logs REJECT in history)
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          status: "PENDING",
          notes: data.notes + `\n[ปฏิเสธงานโดย IT]: ${reason}`,
        },
      });

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "ปฏิเสธงานไม่สำเร็จ");
      setLoading(false);
    }
  };

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
          // Do NOT send assignedTo here, to prevent changing assignee accidentally
        },
      });

      router.push("/it/repairs");
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">
                งานซ่อม #{data.ticketCode}
              </h1>
              <p className="text-sm text-zinc-500">
                แจ้งเมื่อ {new Date(data.createdAt).toLocaleString("th-TH")}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-sm text-zinc-500 hover:text-zinc-900 underline"
            >
              ย้อนกลับ
            </button>
          </div>
        </header>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT : READ / EDIT (If my job) */}
          <section className="lg:col-span-2 space-y-6">
            <Block title="รายละเอียดปัญหา">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">หัวข้อปัญหา</label>
                  {canEdit ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <div className="text-sm text-zinc-900 font-medium">
                      {data.title}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">สถานที่</label>
                  {canEdit ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <div className="text-sm text-zinc-900">{data.location}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">
                    รายละเอียดเพิ่มเติม
                  </label>
                  {canEdit ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  ) : (
                    <div className="text-sm text-zinc-900 whitespace-pre-wrap">
                      {data.description || "-"}
                    </div>
                  )}
                </div>
              </div>
            </Block>

            <Block title="ข้อมูลผู้แจ้ง">
              <div className="grid grid-cols-2 gap-4">
                <Item label="ชื่อ" value={data.reporterName} />
                <Item label="แผนก" value={data.reporterDepartment} />
                <Item label="โทรศัพท์" value={data.reporterPhone} />
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
          </section>

          {/* RIGHT : ACTION */}
          <aside className="space-y-6">
            <Block title="การจัดการ">
              {/* Status - Edit only if my job */}
              {canEdit ? (
                <Select label="สถานะ" value={status} onChange={setStatus}>
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                  <option value="WAITING_PARTS">รออะไหล่</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </Select>
              ) : (
                <Item label="สถานะ" value={statusMapping[status] || status} />
              )}

              {/* Urgency - Edit only if my job */}
              {canEdit ? (
                <Select
                  label="ความเร่งด่วน"
                  value={urgency}
                  onChange={setUrgency}
                >
                  <option value="NORMAL">ปกติ</option>
                  <option value="URGENT">ด่วน</option>
                  <option value="CRITICAL">ด่วนมาก</option>
                </Select>
              ) : (
                <Item
                  label="ความเร่งด่วน"
                  value={
                    urgency === "CRITICAL"
                      ? "ด่วนมาก"
                      : urgency === "URGENT"
                        ? "ด่วน"
                        : "ปกติ"
                  }
                />
              )}

              {/* Assignee - Read Only */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">ผู้รับผิดชอบ</label>
                <div className="font-medium text-sm text-zinc-900">
                  {isAssigned
                    ? data.assignees.map((a) => a.name).join(", ")
                    : "ยังไม่มีผู้รับงาน"}
                </div>
              </div>
            </Block>

            <Block title="บันทึกการซ่อม">
              {canEdit ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  placeholder="บันทึกขั้นตอนหรือผลการซ่อม..."
                />
              ) : (
                <div className="text-sm text-zinc-900 whitespace-pre-wrap">
                  {data.notes || "-"}
                </div>
              )}
            </Block>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Case 1: Assigned to me, waiting for acceptance */}
              {isMyJob && data.status === "ASSIGNED" && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAcceptJob}
                    disabled={loading}
                    className="bg-blue-600 text-white text-sm py-3 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    รับงาน
                  </button>
                  <button
                    onClick={handleRejectJob}
                    disabled={loading}
                    className="bg-red-50 text-red-600 border border-red-200 text-sm py-3 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    ปฏิเสธงาน
                  </button>
                </div>
              )}

              {/* Case 2: Not assigned, can accept? (Legacy/Pool pickup) */}
              {!isAssigned && !isMyJob && data.status === "PENDING" && (
                <button
                  onClick={handleAcceptJob}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white text-sm py-3 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
                >
                  รับงานซ่อมนี้
                </button>
              )}

              {/* Save Button - Only for assignee (and accepted) */}
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-zinc-900 text-white text-sm py-3 rounded-lg font-medium hover:bg-zinc-800 shadow-sm transition-colors"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const statusMapping: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  WAITING_PARTS: "รออะไหล่",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

/* ---------------- UI Helpers ---------------- */

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-200 rounded-lg p-5 space-y-4 bg-white shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
        {title}
      </h2>
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
      <div className="text-zinc-500 mb-1 text-xs">{label}</div>
      <div
        className={`text-zinc-900 font-medium ${multiline ? "whitespace-pre-wrap" : ""}`}
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
        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
      >
        {children}
      </select>
    </div>
  );
}
