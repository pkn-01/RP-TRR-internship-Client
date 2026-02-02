"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Building,
  Shield,
  Edit2,
  Save,
  LogOut,
  MessageCircle,
  Link,
  Unlink,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface LineOALink {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  status: "PENDING" | "VERIFIED" | "UNLINKED";
  linkedAt: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "USER" | "IT" | "ADMIN";
  department?: string;
  createdAt: string;
}

const roleLabels = {
  USER: { label: "ผู้ใช้ทั่วไป", color: "bg-blue-100 text-blue-700" },
  IT: { label: "IT Support", color: "bg-orange-100 text-orange-700" },
  ADMIN: { label: "Admin", color: "bg-red-100 text-red-700" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    department: "",
  });

  // LINE Linking State
  const [lineLink, setLineLink] = useState<LineOALink | null>(null);
  const [lineLinkLoading, setLineLinkLoading] = useState(true);
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchLineLinkStatus();
    }
  }, [profile?.id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditData({
          name: data.name,
          department: data.department || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLineLinkStatus = async () => {
    if (!profile?.id) return;
    try {
      const response = await fetch(
        `/api/line-oa/linking/status?userId=${profile.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.isLinked) {
          setLineLink(data.data);
        } else {
          setLineLink(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch LINE link status:", error);
    } finally {
      setLineLinkLoading(false);
    }
  };

  const handleInitiateLinking = async () => {
    if (!profile?.id) return;
    setLinkingInProgress(true);
    try {
      const response = await fetch("/api/line-oa/linking/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.linkingUrl) {
          // Open LINE linking in new tab
          window.open(data.linkingUrl, "_blank");
        }
      }
    } catch (error) {
      console.error("Failed to initiate LINE linking:", error);
    } finally {
      setLinkingInProgress(false);
    }
  };

  const handleUnlinkAccount = async () => {
    if (!profile?.id) return;
    if (!confirm("ต้องการยกเลิกการเชื่อมต่อ LINE หรือไม่?")) return;

    try {
      const response = await fetch(
        `/api/line-oa/linking?userId=${profile.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setLineLink(null);
      }
    } catch (error) {
      console.error("Failed to unlink LINE account:", error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    router.push("/login/admin");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">ไม่สามารถโหลดข้อมูลโปรไฟล์ได้</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User size={40} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-blue-100 mt-1">บัญชีผู้ใช้ของคุณ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={18} />
                <span>แก้ไข</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <User size={20} className="text-gray-600" />
                  <span className="text-gray-900">{profile.name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <Mail size={20} className="text-gray-600" />
                <span className="text-gray-900">{profile.email}</span>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แผนก
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) =>
                    setEditData({ ...editData, department: e.target.value })
                  }
                  placeholder="ไม่ระบุ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Building size={20} className="text-gray-600" />
                  <span className="text-gray-900">
                    {profile.department || "ไม่ระบุ"}
                  </span>
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บทบาท
              </label>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <Shield size={20} className="text-gray-600" />
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    roleLabels[profile.role].color
                  }`}
                >
                  {roleLabels[profile.role].label}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={18} />
                <span>บันทึก</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ข้อมูลบัญชี</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">วันที่สร้างบัญชี</span>
              <span className="font-medium text-gray-900">
                {new Date(profile.createdAt).toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">ID ผู้ใช้</span>
              <span className="font-medium text-gray-900">#{profile.id}</span>
            </div>
          </div>
        </div>

        {/* LINE Account Linking - Only show for IT and ADMIN */}
        {(profile.role === "IT" || profile.role === "ADMIN") && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle size={22} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  LINE Notification
                </h2>
                <p className="text-sm text-gray-600">
                  รับแจ้งเตือนงานซ่อมผ่าน LINE
                </p>
              </div>
            </div>

            {lineLinkLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : lineLink ? (
              /* Linked State */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      เชื่อมต่อ LINE แล้ว
                    </p>
                    <p className="text-sm text-green-700">
                      {lineLink.displayName || "LINE Account"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">เชื่อมต่อเมื่อ</p>
                      <p className="font-medium text-gray-900">
                        {new Date(lineLink.linkedAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                    <button
                      onClick={handleUnlinkAccount}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Unlink size={16} />
                      <span>ยกเลิกการเชื่อมต่อ</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>💡 เมื่อมีงานซ่อมใหม่:</strong>{" "}
                    คุณจะได้รับแจ้งเตือนทันทีผ่าน LINE
                  </p>
                </div>
              </div>
            ) : (
              /* Not Linked State */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">
                      ยังไม่ได้เชื่อมต่อ LINE
                    </p>
                    <p className="text-sm text-yellow-700">
                      เชื่อมต่อเพื่อรับแจ้งเตือนงานซ่อมทันที
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleInitiateLinking}
                  disabled={linkingInProgress}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {linkingInProgress ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Link size={20} />
                  )}
                  <span>
                    {linkingInProgress ? "กำลังดำเนินการ..." : "เชื่อมต่อ LINE"}
                  </span>
                </button>

                <p className="text-sm text-gray-500 text-center">
                  คลิกเพื่อเชื่อมบัญชีเว็บกับ LINE Official Account
                </p>
              </div>
            )}
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-red-600">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">โซนอันตราย</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">ออกจากระบบ</h3>
              <p className="text-sm text-gray-600 mt-1">ออกจากบัญชีปัจจุบัน</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
