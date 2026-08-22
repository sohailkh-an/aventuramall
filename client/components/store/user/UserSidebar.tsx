"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { 
  Home, 
  FileText, 
  // Download, 
  // RefreshCcw, 
  Heart, 
  ArrowLeftRight, 
  // MessageSquare, 
  DollarSign, 
  // HelpCircle, 
  Lock, 
  User as UserIcon,
} from "lucide-react";

type UserSidebarData = {
  name: string;
  email: string;
  image?: string | null;
};

export const USER_MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Purchase History", href: "/dashboard/purchase-history", icon: FileText, badge: "new" },
  // { label: "Downloads", href: "/dashboard/downloads", icon: Download },
  // { label: "Sent Refund Request", href: "/dashboard/refunds", icon: RefreshCcw },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Compare", href: "/dashboard/compare", icon: ArrowLeftRight },
  // { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "My Wallet", href: "/dashboard/wallet", icon: DollarSign },
  // { label: "Support Ticket", href: "/dashboard/support", icon: HelpCircle },
  { label: "Transaction Password", href: "/dashboard/transaction-password", icon: Lock },
  { label: "Manage Profile", href: "/dashboard/profile", icon: UserIcon },
];

function UserSidebarContent({
  pathname,
  userData,
  onNavigate,
}: {
  pathname: string;
  userData: UserSidebarData | null;
  onNavigate: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col h-full">
      {/* Header Profile Area */}
      <div className="bg-gradient-to-br from-brand to-[#E63E00] p-8 flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 overflow-hidden ring-2 ring-white/30">
          {userData?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userData.image}
              alt={userData.name ? `${userData.name} profile photo` : "Profile photo"}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserIcon className="w-10 h-10 text-white" />
          )}
        </div>
        <h3 className="font-bold text-lg">{userData?.name || "Loading..."}</h3>
        <p className="text-sm opacity-90">{userData?.email || "loading@email.com"}</p>
      </div>

      {/* Menu Items */}
      <div className="py-4 flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 px-4">
          {USER_MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-md transition-colors text-sm",
                  isActive
                    ? "bg-[#FFEBE5] text-brand font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-brand"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4", isActive ? "text-brand" : "text-slate-400")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#00D26A] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function UserSidebar() {
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserSidebarData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/api/users/me") as { data: Partial<UserSidebarData> };
        setUserData({
          name: res.data.name || "",
          email: res.data.email || "",
          image: res.data.image || null,
        });
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="hidden lg:block w-72 shrink-0 h-full">
      <UserSidebarContent pathname={pathname} userData={userData} onNavigate={() => undefined} />
    </div>
  );
}
