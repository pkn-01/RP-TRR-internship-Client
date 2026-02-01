"use client";

import { User } from "@/services/userService";
import { Trash2, ChevronRight, Loader2, Mail, Phone, MessageCircle } from "lucide-react";

interface UserTableProps {
  users: User[];
  onView?: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
}

export default function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl border border-slate-100">
        <Loader2 className="animate-spin text-slate-300 mb-2" size={32} />
        <p className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-slate-100">
        <p className="text-slate-400 font-medium">
          ไม่พบรายชื่อผู้ใช้งานในระบบ
        </p>
      </div>
    );
  }

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "IT":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "ผู้ดูแลระบบ",
      IT: "ทีมไอที",
      USER: "ผู้ใช้งาน",
    };
    return labels[role] || role;
  };

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                ชื่อ-นามสกุล
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                ข้อมูลติดต่อ
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                บทบาท
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                ส่ง/รับงาน
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr
                key={user.id}
                className="group hover:bg-slate-50/80 transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-400">
                    {user.department || "ไม่ระบุแผนก"}
                  </div>
                </td>
  
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {user.email}
                    </div>
                    {user.phoneNumber && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={14} className="text-slate-400" />
                        {user.phoneNumber}
                      </div>
                    )}
                    {user.lineId && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MessageCircle size={14} className="text-slate-400" />
                        {user.lineId}
                      </div>
                    )}
                  </div>
                </td>
  
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${getRoleStyle(
                      user.role
                    )}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
  
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-semibold text-slate-700">
                    {user._count?.tickets || 0} /{" "}
                    <span className="text-indigo-600">
                      {user._count?.assigned || 0}
                    </span>
                  </div>
                </td>
  
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(user)}
                      className="flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-medium text-sm"
                    >
                      {/* จัดการ */}
                      <ChevronRight
                        size={18}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="ลบ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">
                  {user.department || "ไม่ระบุแผนก"}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleStyle(
                  user.role
                )}`}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <span className="text-slate-400 text-xs w-16">อีเมล:</span>
                {user.email}
              </div>
              {user.phoneNumber && (
                <div className="text-sm text-slate-600 flex items-center gap-2">
                   <span className="text-slate-400 text-xs w-16">เบอร์โทร:</span>
                  {user.phoneNumber}
                </div>
              )}
              {user.lineId && (
                <div className="text-sm text-slate-600 flex items-center gap-2">
                   <span className="text-slate-400 text-xs w-16">Line ID:</span>
                  {user.lineId}
                </div>
              )}
               <div className="text-sm text-slate-600 flex items-center gap-2">
                   <span className="text-slate-400 text-xs w-16">งาน (ส่ง/รับ):</span>
                   <span className="font-medium">{user._count?.tickets || 0}</span> / 
                   <span className="font-medium text-indigo-600">{user._count?.assigned || 0}</span>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50">
              <button
                onClick={() => onEdit(user)}
                className="flex items-center justify-center flex-1 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium"
              >
                แก้ไขข้อมูล
              </button>
              <button
                onClick={() => onDelete(user)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="ลบ"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
