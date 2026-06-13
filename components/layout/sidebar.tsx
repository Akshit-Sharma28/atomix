"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  FolderOpen,
  ShieldAlert,
  KanbanSquare,
  FileText,
  FileSearch,
  Upload,
  Users,
  UserCheck,
  Clock3,
  Bot,
  Brain,
} from "lucide-react";

interface Props {
  role?: string;
}

export default function Sidebar({
  role = "VIEWER",
}: Props) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT", "DEVELOPER", "VIEWER"],
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderOpen,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT", "DEVELOPER"],
    },
    {
      href: "/findings",
      label: "Findings",
      icon: ShieldAlert,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT", "DEVELOPER"],
    },
    {
      href: "/reviews",
      label: "Security Reviews",
      icon: FileSearch,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT"],
    },
    {
      href: "/reviewers",
      label: "Pentester Tracker",
      icon: UserCheck,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT"],
    },
    {
      href: "/my-findings",
      label: "My Findings",
      icon: ShieldAlert,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT", "DEVELOPER"],
    },
    {
      href: "/timeline",
      label: "Timeline",
      icon: KanbanSquare,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT"],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
      roles: ["ADMIN", "SECURITY_LEAD"],
    },
    {
      href: "/import",
      label: "Import",
      icon: Upload,
      roles: ["ADMIN", "CONSULTANT"],
    },
    {
      href: "/users",
      label: "Users",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      href: "/sla",
      label: "SLA",
      icon: Clock3,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT"],
    },
    {
      href: "/copilot",
      label: "Security Copilot",
      icon: Bot,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT", "DEVELOPER"],
    },
    {
      href: "/knowledge",
      label: "Knowledge Base",
      icon: Brain,
      roles: ["ADMIN", "SECURITY_LEAD", "CONSULTANT"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside
      className="
      w-72
      min-h-screen
      bg-slate-950/90
      backdrop-blur-xl
      border-r
      border-slate-800
      flex
      flex-col
      "
    >
      {/* Logo */}

      <div
        className="
        h-[113px]
        px-8
        flex
        flex-col
        justify-center
        border-b
        border-slate-800
        "
      >
        <h1
          className="
          text-[2rem]
          font-black
          tracking-tight
          text-yellow-400
          leading-none
          "
        >
          ATOMIX
        </h1>

        <p
          className="
          text-slate-500
          text-[11px]
          mt-1
          "
        >
          AI-Powered Pentest Platform
        </p>
      </div>

      {/* Navigation */}

      <nav
        className="
        flex-1
        px-4
        pt-3
        pb-4
        "
      >
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  transition-all
                  duration-200
                  overflow-hidden

                  ${
                    active
                      ? `
                      bg-cyan-500/10
                      text-cyan-400
                      border
                      border-cyan-500/20
                      shadow-lg
                      shadow-cyan-500/5
                      `
                      : `
                      text-slate-300
                      hover:bg-slate-900
                      hover:text-cyan-400
                      `
                  }
                `}
              >
                {active && (
                  <div
                    className="
                    absolute
                    left-0
                    top-2
                    bottom-2
                    w-1
                    rounded-r-full
                    bg-cyan-400
                    "
                  />
                )}

                <Icon
                  size={18}
                  className={
                    active
                      ? "text-cyan-400"
                      : ""
                  }
                />

                <span className="font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
