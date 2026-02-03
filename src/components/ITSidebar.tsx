"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Users,
  LogOut,
  Menu,
  X,
  User,
  Package,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { userService, User as UserType } from "@/services/userService";

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: React.ComponentType<{
    size: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  href?: string;
  subItems?: SubMenuItem[];
}

export default function ITSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const user = await userService.getUserById(parseInt(userId));
          setUserProfile(user);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Menu items for IT role
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/it/dashboard" },
    { icon: Package, label: "ระบบยืมของ", href: "/it/loans" },
    { icon: Wrench, label: "งานซ่อมแซม", href: "/it/repairs" },
    { icon: Users, label: "จัดการผู้ใช้", href: "/it/users" },
  ];

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  const isMenuActive = useCallback(
    (item: MenuItem) => {
      if (item.href) {
        return isActive(item.href);
      }
      if (item.subItems) {
        return item.subItems.some((sub) => isActive(sub.href));
      }
      return false;
    },
    [isActive],
  );

  const toggleMenu = useCallback((label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label],
    );
  }, []);

  // Auto-expand menu if a submenu is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some((sub) => isActive(sub.href));
        if (hasActiveChild && !expandedMenus.includes(item.label)) {
          setExpandedMenus((prev) => [...prev, item.label]);
        }
      }
    });
  }, [pathname]);

  useEffect(() => setIsOpen(false), [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      localStorage.clear();
      router.push("/login/admin");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white z-50 px-4 flex items-center justify-between shadow-sm">
        <Link href="/it/dashboard" className="flex items-center gap-2">
          <span className="font-bold text-gray-800 text-lg tracking-wide">
            IT SUPPORT
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 lg:hidden z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-56 bg-white transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-center">
          <Link href="/it/dashboard" className="flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800 tracking-wider">
              IT
            </span>
            <span className="text-[10px] text-gray-400 font-medium tracking-wider">
              SUPPORT
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus.includes(item.label);
            const active = isMenuActive(item);

            if (hasSubItems) {
              return (
                <div key={item.label}>
                  {/* Parent Menu with Dropdown */}
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? "text-gray-900"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={20}
                        strokeWidth={1.5}
                        className="text-gray-500"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </button>

                  {/* Submenu Items */}
                  {isExpanded && (
                    <div className="mt-1 ml-8 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const subActive = isActive(subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                              subActive
                                ? "text-gray-900 font-medium"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular Menu Item (no submenu)
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={20} strokeWidth={1.5} className="text-gray-500" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 bg-white">
          <Link
            href="/it/profile"
            className="flex items-center gap-3 mb-4 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors group"
          >
            {userProfile?.profilePicture || userProfile?.pictureUrl ? (
              <Image
                src={
                  userProfile?.profilePicture || userProfile?.pictureUrl || ""
                }
                alt={userProfile?.name || "User"}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border-2 border-gray-200 group-hover:border-orange-400 transition-colors"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-amber-700 flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                <User size={20} className="text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-orange-700 transition-colors">
                {userProfile?.name || "IT Profile"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userProfile?.email || "it@trr.com"}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
