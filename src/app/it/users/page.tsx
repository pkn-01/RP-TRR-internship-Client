"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Loader2,
  Users,
  Shield,
  Mail,
  Building2,
  UserCog,
  User as UserIcon,
  Phone,
  MessageCircle,
} from "lucide-react";

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "USER" | "IT";
  department: string;
  phoneNumber: string;
  lineId: string;
  createdAt: string;
}

export default function ITUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER" as "USER", // IT can only create/edit USER
    department: "",
    phoneNumber: "",
    lineId: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        router.push("/login/admin");
        return;
      }

      setLoading(true);
      // Fetch only USER and IT roles
      const data = await apiFetch("/users?roles=USER,IT");
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchStr =
        `${user.name} ${user.email} ${user.department}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || user.role === filterRole;

      // Double check to exclude admins even if API returned them (safety)
      const isNotAdmin = user.role !== "ADMIN";

      return matchesSearch && matchesRole && isNotAdmin;
    });
  }, [users, searchTerm, filterRole]);

  const stats = useMemo(
    () => ({
      total: users.length,
      its: users.filter((u) => u.role === "IT").length,
      users: users.filter((u) => u.role === "USER").length,
    }),
    [users],
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
      department: "",
      phoneNumber: "",
      lineId: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordError("");
  };

  const validatePassword = (password: string): string => {
    if (password.length < 8) return "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
    if (!/[A-Z]/.test(password)) return "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่";
    if (!/[a-z]/.test(password)) return "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก";
    if (!/[0-9]/.test(password)) return "รหัสผ่านต้องมีตัวเลข";
    return "";
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("กรุณากรอกข้อมูลจำเป็น: ชื่อ, อีเมล, รหัสผ่าน");
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "USER", // Enforce USER role
          department: formData.department,
          phoneNumber: formData.phoneNumber,
          lineId: formData.lineId,
        }),
      });

      alert("เพิ่มผู้ใช้สำเร็จ");
      resetForm();
      setShowModal(false);
      await fetchUsers();
    } catch (err) {
      console.error("Error:", err);
      alert("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      alert("กรุณากรอกข้อมูลจำเป็น");
      return;
    }

    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (passwordValidation) {
        setPasswordError(passwordValidation);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setPasswordError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
    }

    try {
      setSubmitting(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: "USER", // Enforce USER role on edit too
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        lineId: formData.lineId,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await apiFetch(`/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      alert("อัปเดตผู้ใช้สำเร็จ");
      resetForm();
      setShowDetailModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("ลบผู้ใช้นี้ใช่หรือไม่?")) return;

    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      fetchUsers();
      alert("ลบผู้ใช้สำเร็จ");
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: "USER", // Always default/force to USER for IT
      department: user.department,
      phoneNumber: user.phoneNumber,
      lineId: user.lineId,
    });
    setPasswordError("");
    setShowDetailModal(true);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            จัดการผู้ใช้
          </h1>
          <p className="text-gray-500 mt-1">
            ดูแลและจัดการรายชื่อพนักงาน (ระดับ User เท่านั้น)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus size={20} />
          เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="ผู้ใช้ทั้งหมด"
          count={stats.total}
          icon={<Users className="text-neutral-600" />}
          bgClass="bg-neutral-50"
        />
        <StatCard
          label="ทีม IT"
          count={stats.its}
          icon={<Shield className="text-neutral-600" />}
          bgClass="bg-neutral-50"
        />
        <StatCard
          label="ผู้ใช้ทั่วไป"
          count={stats.users}
          icon={<UserIcon className="text-neutral-600" />}
          bgClass="bg-neutral-50"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, แผนก..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-400 text-sm font-medium"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select
              className="px-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none text-sm cursor-pointer"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">ทุกบทบาท</option>
              <option value="IT">IT Support</option>
              <option value="USER">General User</option>
            </select>
            <button
              onClick={fetchUsers}
              className="p-2.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Table */}
        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.department || "ไม่ระบุแผนก"}
                      </div>
                    </div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail size={12} className="text-gray-400" />
                    {user.email}
                  </div>
                  {user.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone size={12} className="text-gray-400" />
                      {user.phoneNumber}
                    </div>
                  )}
                  {user.lineId && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MessageCircle size={12} className="text-gray-400" />
                      {user.lineId}
                    </div>
                  )}
                </div>

                {/* Actions Only for USER role or Self (if applicable, but restricted here to USER editing mostly) */}
                {user.role === "USER" && (
                  <div className="flex justify-end gap-2 bg-gray-50 p-2 rounded-lg">
                    <button
                      onClick={() => openEditModal(user)}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm hover:text-blue-600 text-xs font-medium flex items-center gap-1"
                    >
                      <Edit2 size={14} /> แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-1.5 bg-white border border-red-100 text-red-600 rounded-lg shadow-sm hover:bg-red-50 text-xs font-medium flex items-center gap-1"
                    >
                      <Trash2 size={14} /> ลบ
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400">
              <div className="flex flex-col items-center justify-center gap-3">
                <UserCog size={48} className="text-gray-200" />
                <p>ไม่พบข้อมูลผู้ใช้</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  ข้อมูลติดต่อ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  แผนก
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            สมัครเมื่อ{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone size={12} className="text-gray-400" />
                            {user.phoneNumber}
                          </div>
                        )}
                        {user.lineId && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MessageCircle
                              size={12}
                              className="text-gray-400"
                            />
                            {user.lineId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 size={14} className="text-gray-400" />
                        {user.department || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === "USER" && (
                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <UserCog size={48} className="text-gray-200" />
                      <p>ไม่พบข้อมูลผู้ใช้</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showModal || (showDetailModal && selectedUser)) && (
        <UserModal
          title={showModal ? "เพิ่มพนักงานใหม่" : "แก้ไขข้อมูลพนักงาน"}
          onClose={() => {
            setShowModal(false);
            setShowDetailModal(false);
          }}
          submitting={submitting}
          onSubmit={showModal ? handleAddUser : handleEditUser}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="ชื่อ-นามสกุล"
                required
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                placeholder="สมชาย ใจดี"
              />
              <FormInput
                label="อีเมล"
                type="email"
                required
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
                placeholder="somchai@example.com"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={16} /> ตั้งค่าความปลอดภัย
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {showModal
                      ? "รหัสผ่าน"
                      : "รหัสผ่านใหม่ (ระบุเมื่อต้องการเปลี่ยน)"}
                    {showModal && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setPasswordError("");
                      }}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-sm"
                      placeholder={
                        showModal ? "••••••••" : "เว้นว่างหากไม่ต้องการเปลี่ยน"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    ยืนยันรหัสผ่าน
                    {showModal && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        setPasswordError("");
                      }}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-sm"
                      placeholder={
                        showModal ? "••••••••" : "เว้นว่างหากไม่ต้องการเปลี่ยน"
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                  <X size={12} /> {passwordError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  บทบาท
                </label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed flex items-center justify-between">
                  <span>ผู้ใช้ทั่วไป (General User)</span>
                  <Shield size={14} className="text-neutral-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  * IT สามารถจัดการได้เฉพาะผู้ใช้ทั่วไป
                </p>
              </div>
              <FormInput
                label="แผนก"
                value={formData.department}
                onChange={(v) => setFormData({ ...formData, department: v })}
                placeholder="ระบุแผนก"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="เบอร์โทรศัพท์"
                value={formData.phoneNumber}
                onChange={(v) => setFormData({ ...formData, phoneNumber: v })}
                placeholder="0xx-xxx-xxxx"
              />
              <FormInput
                label="Line ID"
                value={formData.lineId}
                onChange={(v) => setFormData({ ...formData, lineId: v })}
                placeholder="@lineid"
              />
            </div>
          </div>
        </UserModal>
      )}
    </div>
  );
}

// --- Components ---

function StatCard({
  label,
  count,
  icon,
  bgClass,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  bgClass: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{count}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    ADMIN: "bg-black text-white border-black",
    IT: "bg-neutral-800 text-white border-neutral-800",
    USER: "bg-neutral-100 text-neutral-700 border-neutral-300",
  };

  const labels = {
    ADMIN: "ผู้ดูแลระบบ",
    IT: "IT Support",
    USER: "ผู้ใช้งานทั่วไป",
  };

  const roleKey = role as keyof typeof styles;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[roleKey] || "bg-gray-100 text-gray-600"}`}
    >
      {labels[roleKey] || role}
    </span>
  );
}

function UserModal({ title, children, onClose, onSubmit, submitting }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-all text-sm"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-black text-white font-medium hover:bg-gray-800 rounded-xl transition-all flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-black/20"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormInputProps {
  label: string;
  type?: string;
  required?: boolean;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FormInput({
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
      />
    </div>
  );
}
