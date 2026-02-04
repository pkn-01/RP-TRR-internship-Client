"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
  Edit2,
} from "lucide-react";
import AdminUserModal from "@/components/modals/AdminUserModal";
import Swal from "sweetalert2";
import { userService, User } from "@/services/userService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const LIMIT = 10;

  // Stats
  const stats = {
    total: totalUsers,
    it: users.filter((u) => u.role === "IT").length,
    user: users.filter((u) => u.role === "USER").length,
  };

  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers(page, LIMIT);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalUsers(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleSaveUser = async (data: Partial<User>) => {
    try {
      const { password, ...userDataWithoutPassword } = data;
      if (!selectedUser) {
        if (!password) {
          Swal.fire("ข้อผิดพลาด", "กรุณาระบุรหัสผ่าน", "warning");
          return;
        }
        await userService.createUser({ ...userDataWithoutPassword, password });
      } else {
        await userService.updateUser(selectedUser.id, userDataWithoutPassword);
        if (password) {
          await userService.changePassword(selectedUser.id, password);
        }
      }
      fetchUsers(currentPage);
      setIsModalOpen(false);
      Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
    } catch (err) {
      console.error("Error saving user:", err);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  const confirmDelete = async (user: User) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบสมาชิก",
      text: `ต้องการลบผู้ใช้ "${user.name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      await userService.deleteUser(user.id);
      await Swal.fire("ลบสำเร็จ!", "ผู้ใช้ถูกลบแล้ว", "success");
      fetchUsers(currentPage);
    } catch {
      Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดในการลบ", "error");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "ผู้ดูแลระบบ",
      IT: "ทีม IT",
      USER: "สมาชิกทั่วไป",
    };
    return labels[role] || role;
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="ผู้ใช้ทั้งหมด" value={stats.total} />
          <StatCard label="ทีม IT" value={stats.it} />
          <StatCard label="ผู้ใช้ทั่วไป" value={stats.user} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อ"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                ค้นหา
              </button>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none"
            >
              <option value="all">ทุกบทบาท</option>
              <option value="ADMIN">ผู้ดูแลระบบ</option>
              <option value="IT">ทีม IT</option>
              <option value="USER">สมาชิกทั่วไป</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50 flex items-center gap-1"
            >
              <UserPlus size={16} />
              เพิ่มทีม IT
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50">
              Export reprot
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  ชื่อ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  ข้อมูลติดต่อ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  บทบาท
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  แผนก
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {user.displayName || user.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {user.phoneNumber || user.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {user.department || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(user)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    ไม่พบรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {user.displayName || user.name}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {user.phoneNumber || user.email}
              </p>
              <p className="text-xs text-gray-500">
                แผนก: {user.department || "-"}
              </p>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => confirmDelete(user)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              ไม่พบรายการ
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage}/{totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AdminUserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
