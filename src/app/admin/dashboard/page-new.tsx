"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../services/api";
import {
  Wrench,
  Users,
  Package,
  Download,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  Server,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
}

interface QuickAction {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  isNew?: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      id: number;
      type: string;
      message: string;
      timestamp: string;
    }>
  >([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch repair statistics
        const repairStats = await apiFetch(
          "/repairs/statistics/overview",
          "GET",
        );

        // Fetch all users count
        const usersData = await apiFetch("/users?page=1&limit=1000", "GET");

        // Fetch all loans
        const loansData = await apiFetch("/loans", "GET");

        const userCount = usersData?.total || usersData?.length || 0;
        const loansCount = Array.isArray(loansData)
          ? loansData.length
          : loansData?.total || 0;

        setStats([
          {
            title: "ทั้งหมดงานซ่อม",
            value: repairStats?.total || 0,
            change: undefined,
            trend: undefined,
            icon: Wrench,
            color: "text-blue-500",
          },
          {
            title: "รอการดำเนินการ",
            value: repairStats?.pending || 0,
            change: undefined,
            trend: undefined,
            icon: Clock,
            color: "text-amber-500",
          },
          {
            title: "งานสำเร็จ",
            value: repairStats?.completed || 0,
            change: undefined,
            trend: undefined,
            icon: CheckCircle,
            color: "text-green-500",
          },
          {
            title: "จำนวนผู้ใช้",
            value: userCount,
            change: undefined,
            trend: undefined,
            icon: Users,
            color: "text-purple-500",
          },
          {
            title: "อุปกรณ์ที่ยืม",
            value: loansCount,
            change: undefined,
            trend: undefined,
            icon: Package,
            color: "text-emerald-500",
          },
          {
            title: "กำลังดำเนินการ",
            value: repairStats?.inProgress || 0,
            change: undefined,
            trend: undefined,
            icon: Server,
            color: "text-cyan-500",
          },
        ]);

        // Fetch recent repairs for activity
        const recentRepairs = await apiFetch("/repairs?limit=5", "GET");
        const repairsArray = Array.isArray(recentRepairs)
          ? recentRepairs
          : recentRepairs?.data || [];

        const activities = repairsArray
          .slice(0, 4)
          .map((repair: Record<string, unknown>, idx: number) => ({
            id: idx + 1,
            type: "repair",
            message: `งานซ่อมแซม - ${String(repair.ticketCode || repair.id)}`,
            timestamp: new Date(String(repair.createdAt)).toLocaleDateString(
              "th-TH",
            ),
          }));

        setRecentActivity(
          activities.length > 0
            ? activities
            : [
                {
                  id: 1,
                  type: "system",
                  message: "ระบบพร้อมใช้งาน",
                  timestamp: "เดี๋ยวนี้",
                },
              ],
        );
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // Set default values on error
        setStats([
          {
            title: "ทั้งหมดงานซ่อม",
            value: "-",
            icon: Wrench,
            color: "text-blue-500",
          },
          {
            title: "รอการดำเนินการ",
            value: "-",
            icon: Clock,
            color: "text-amber-500",
          },
          {
            title: "งานสำเร็จ",
            value: "-",
            icon: CheckCircle,
            color: "text-green-500",
          },
          {
            title: "จำนวนผู้ใช้",
            value: "-",
            icon: Users,
            color: "text-purple-500",
          },
          {
            title: "อุปกรณ์ที่ยืม",
            value: "-",
            icon: Package,
            color: "text-emerald-500",
          },
          {
            title: "กำลังดำเนินการ",
            value: "-",
            icon: Server,
            color: "text-cyan-500",
          },
        ]);
        setRecentActivity([
          {
            id: 1,
            type: "system",
            message: "ไม่สามารถโหลดข้อมูล",
            timestamp: "เดี๋ยวนี้",
          },
        ]);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions: QuickAction[] = [
    {
      icon: Trash2,
      label: "ลบรายการซ่อม",
      description: "ลบรายการซ่อมแซมออกจากระบบ",
      href: "/admin/delete-repairs",
      color: "text-red-500",
      bgColor: "bg-red-900/20",
      isNew: true,
    },
    {
      icon: Download,
      label: "นำออกข้อมูล",
      description: "ส่งออกข้อมูลต่างๆ เป็น CSV, JSON, PDF",
      href: "/admin/export-data",
      color: "text-green-500",
      bgColor: "bg-green-900/20",
      isNew: true,
    },
    {
      icon: Users,
      label: "จัดการผู้ใช้",
      description: "บริหารบัญชีผู้ใช้และสิทธิ์การเข้าถึง",
      href: "/admin/users",
      color: "text-blue-500",
      bgColor: "bg-blue-900/20",
    },
    {
      icon: Wrench,
      label: "บริหารงานซ่อม",
      description: "จัดการและติดตามทั้งหมดงานซ่อมแซม",
      href: "/admin/repairs",
      color: "text-amber-500",
      bgColor: "bg-amber-900/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-700/50 via-slate-800/50 to-slate-900/50 p-8">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            ยินดีต้อนรับสู่แพนเนลแอดมิน
          </h1>
          <p className="text-slate-300 text-lg">
            ระบบจัดการและควบคุมทั้งหมด - สิทธิ์แอดมินสูงสุด
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-slate-600 transition-all hover:bg-slate-800/60"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-700/10 rounded-full -mr-8 -mt-8" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={stat.color}>
                    <Icon size={24} />
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">การดำเนินการด่วน</h2>
          <span className="text-sm text-slate-400">เข้าถึงคุณสมบัติแอดมิน</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 p-6 transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50"
              >
                {/* Gradient Background */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 ${action.bgColor} rounded-full -mr-12 -mt-12 blur-xl transition-all group-hover:blur-3xl opacity-0 group-hover:opacity-100`}
                />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-lg ${action.bgColor} border border-slate-700 flex items-center justify-center`}
                    >
                      <span className={action.color}>
                        <Icon size={24} />
                      </span>
                    </div>
                    {action.isNew && (
                      <span className="px-2 py-1 bg-blue-600/80 text-blue-100 text-[10px] font-bold rounded-full">
                        NEW
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center text-blue-400 text-sm font-medium pt-2 group-hover:translate-x-1 transition-transform">
                    <span>ไปที่ส่วนนี้</span>
                    <ArrowRight size={16} className="ml-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">กิจกรรมล่าสุด</h2>

        <div className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
          <div className="divide-y divide-slate-700">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-slate-200 text-sm font-medium">
                      {activity.message}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    activity.type === "repair"
                      ? "bg-amber-900/30 text-amber-400"
                      : activity.type === "user"
                        ? "bg-blue-900/30 text-blue-400"
                        : activity.type === "loan"
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-purple-900/30 text-purple-400"
                  }`}
                >
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="rounded-xl border-2 border-amber-700/50 bg-amber-900/20 p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-amber-900/50 border border-amber-700/50 flex items-center justify-center shrink-0">
          <AlertCircle size={24} className="text-amber-500" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-100 mb-1">ข้อความสำคัญ</h3>
          <p className="text-amber-200 text-sm">
            สิทธิ์แอดมินคุณสามารถลบข้อมูลสำเร็จและลบผู้ใช้ได้
            การดำเนินการเหล่านี้ไม่สามารถยกเลิกได้ โปรดใช้อย่างระมัดระวัง
          </p>
        </div>
      </div>
    </div>
  );
}
