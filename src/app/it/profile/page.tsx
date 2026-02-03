"use client";

import { useState, useEffect, useRef } from "react";
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
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import Image from "next/image";

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
  profilePicture?: string;
  createdAt: string;
}

export default function ITProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    department: "",
  });

  // Profile picture upload
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const data = await apiFetch("/auth/profile");
      setProfile(data);
      setEditData({
        name: data.name,
        department: data.department || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLineLinkStatus = async () => {
    if (!profile?.id) return;
    try {
      const data = await apiFetch(
        `/line-oa/linking/status?userId=${profile.id}`,
      );
      if (data.isLinked) {
        setLineLink(data.data);
      } else {
        setLineLink(null);
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
      const data = await apiFetch("/line-oa/linking/initiate", "POST", {
        userId: profile.id,
      });
      if (data.linkingUrl) {
        let finalUrl = data.linkingUrl;
        if (typeof window !== "undefined" && finalUrl.includes("localhost")) {
          finalUrl = finalUrl.replace(
            "http://localhost:3000",
            window.location.origin,
          );
          finalUrl = finalUrl.replace(
            "http://localhost",
            window.location.origin,
          );
        }
        window.open(finalUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to initiate LINE linking:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
    } finally {
      setLinkingInProgress(false);
    }
  };

  const handleUnlinkAccount = async () => {
    if (!profile?.id) return;
    if (!confirm("ต้องการยกเลิกการเชื่อมต่อ LINE หรือไม่?")) return;

    try {
      await apiFetch(`/line-oa/linking?userId=${profile.id}`, "DELETE");
      setLineLink(null);
    } catch (error) {
      console.error("Failed to unlink LINE account:", error);
    }
  };

  const handleSave = async () => {
    try {
      const data = await apiFetch("/auth/profile", "PATCH", editData);
      setProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    router.push("/login/it");
  };

  const handlePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const response = await fetch(`/api/auth/profile/picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
    } finally {
      setUploadingPicture(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-[#4A3B32] border-t-transparent rounded-full"></div>
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-[#4A3B32] text-white py-8 shadow-sm">
        <div className="px-8">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePictureUpload}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-[#FFC107] rounded-full flex items-center justify-center border-2 border-black/10 overflow-hidden cursor-pointer relative"
              >
                {profile.profilePicture ? (
                  <Image
                    src={profile.profilePicture}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User size={48} className="text-gray-800" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  {uploadingPicture ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-serif tracking-wide">
                {profile.name}
              </h1>
              <p className="text-white/80 mt-1 font-light">
                บัญชีผู้ใช้ IT Support
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 mt-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
          {/* Curved Green Accent */}
          <div className="absolute left-0 top-0 bottom-0 w-3">
            <svg
              className="h-full w-full"
              viewBox="0 0 12 100"
              preserveAspectRatio="none"
            >
              <path d="M0,15 Q0,0 12,0 L12,100 L0,100 Z" fill="#22C55E" />
            </svg>
          </div>

          <div className="pl-6 pr-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif text-gray-900">
                ข้อมูลส่วนตัว
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  <Edit2 size={16} />
                  <span>แก้ไข</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Name */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">
                  ชื่อ
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#EEEEEE] border-none rounded-lg focus:ring-2 focus:ring-[#4A3B32]"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#EEEEEE] rounded-lg">
                    <User size={20} className="text-gray-500" />
                    <span className="text-gray-700">{profile.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">
                  อีเมล
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#EEEEEE] rounded-lg">
                  <Mail size={20} className="text-gray-500" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">
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
                    className="w-full px-4 py-3 bg-[#EEEEEE] border-none rounded-lg focus:ring-2 focus:ring-[#4A3B32]"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#EEEEEE] rounded-lg">
                    <Building size={20} className="text-gray-500" />
                    <span className="text-gray-700">
                      {profile.department || "ไม่ระบุ"}
                    </span>
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-lg font-medium text-gray-800 mb-2">
                  บทบาท
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#EEEEEE] rounded-lg">
                  <Shield size={20} className="text-gray-500" />
                  <span className="bg-[#C8E6C9] text-gray-800 text-sm px-3 py-1 rounded-full font-medium">
                    {profile.role === "IT" ? "IT Support" : profile.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-[#4A3B32] text-white rounded-lg hover:bg-[#3E3129] transition-colors"
                >
                  <Save size={18} />
                  <span>บันทึก</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
          {/* Curved Green Accent */}
          <div className="absolute left-0 top-0 bottom-0 w-3">
            <svg
              className="h-full w-full"
              viewBox="0 0 12 100"
              preserveAspectRatio="none"
            >
              <path d="M0,15 Q0,0 12,0 L12,100 L0,100 Z" fill="#22C55E" />
            </svg>
          </div>

          <div className="pl-6 pr-8 py-8">
            <h2 className="text-3xl font-serif text-gray-900 mb-6">
              ข้อมูลบัญชี
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-6 py-3 bg-[#EEEEEE] rounded-lg">
                <span className="text-gray-700">วันที่สร้างบัญชี</span>
                <span className="text-gray-900 font-medium">
                  {new Date(profile.createdAt)
                    .toLocaleString("th-TH")
                    .replace(",", "")}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-3 bg-[#EEEEEE] rounded-lg">
                <span className="text-gray-700">ID ผู้ใช้</span>
                <span className="text-gray-900 font-medium">#{profile.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LINE Account Linking */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
          {/* Curved Green Accent */}
          <div className="absolute left-0 top-0 bottom-0 w-3">
            <svg
              className="h-full w-full"
              viewBox="0 0 12 100"
              preserveAspectRatio="none"
            >
              <path d="M0,15 Q0,0 12,0 L12,100 L0,100 Z" fill="#22C55E" />
            </svg>
          </div>

          <div className="pl-6 pr-8 py-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  แจ้งเตือนผ่าน LINE
                </h2>
              </div>
            </div>

            {lineLinkLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
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

                <div
                  className="bg-[#EEEEEE] rounded-lg p-3 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={handleUnlinkAccount}
                >
                  <div className="flex items-center gap-2 text-gray-600">
                    <Unlink size={20} />
                    <span className="font-medium">ยกเลิกการเชื่อมต่อ LINE</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  คลิกเพื่อยกเลิกการเชื่อมบัญชีกับ LINE Official Account
                </p>
              </div>
            ) : (
              /* Not Linked State */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#FFF9C4] rounded-lg">
                  <AlertCircle className="w-6 h-6 text-[#FBC02D] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-[#8D6E63] text-sm">
                      ยังไม่ได้เชื่อมต่อ LINE
                    </p>
                    <p className="text-xs text-[#8D6E63]/80">
                      เชื่อมต่อเพื่อรับแจ้งเตือนงานซ่อมทันที
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleInitiateLinking}
                  disabled={linkingInProgress}
                  className="w-full py-3 bg-[#EEEEEE] rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group"
                >
                  {linkingInProgress ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : (
                    <Link
                      size={20}
                      className="text-gray-500 group-hover:text-gray-700"
                    />
                  )}
                  <span className="text-gray-600 font-medium group-hover:text-gray-800">
                    {linkingInProgress ? "กำลังดำเนินการ..." : "เชื่อมต่อ LINE"}
                  </span>
                </button>

                <p className="text-xs text-gray-400 text-center">
                  คลิกเพื่อเชื่อมบัญชีเว็บกับ LINE Official Account
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
