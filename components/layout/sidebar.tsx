"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BarChart3,
  FolderOpen,
  ShieldAlert,
  KanbanSquare,
  FileSearch,
  Upload,
  Users,
  UserCheck,
  Workflow,
  Clock3,
  Bot,
  Brain,
} from "lucide-react";

interface Props {
  role?: string;
}

function normalizeRole(role: string) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  if (role === "DEVELOPER") {
    return "REVIEWER";
  }

  if (role === "VIEWER") {
    return "CONSULTANT";
  }

  return role;
}

export default function Sidebar({
  role = "CONSULTANT",
}: Props) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/executive",
      label: "Executive Dashboard",
      icon: BarChart3,
      roles: ["ADMIN", "EXECUTIVE"],
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderOpen,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/findings",
      label: "Findings",
      icon: ShieldAlert,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/reviews",
      label: "Security Reviews",
      icon: FileSearch,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/reviewers",
      label: "Pentester Tracker",
      icon: UserCheck,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "EXECUTIVE"],
    },
    {
      href: "/workflow",
      label: "Workflow",
      icon: Workflow,
      roles: ["ADMIN", "GOVERNANCE_TEAM"],
    },
    {
      href: "/my-findings",
      label: "My Findings",
      icon: ShieldAlert,
      roles: ["ADMIN", "QA_REVIEWER", "REVIEWER", "CONSULTANT"],
    },
    {
      href: "/timeline",
      label: "Timeline",
      icon: KanbanSquare,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/import",
      label: "Import",
      icon: Upload,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "ENGAGEMENT_MANAGER", "CONSULTANT"],
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
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/copilot",
      label: "Security Copilot",
      icon: Bot,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/knowledge",
      label: "Knowledge Base",
      icon: Brain,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "QA_REVIEWER",
        "REVIEWER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(normalizedRole)
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
