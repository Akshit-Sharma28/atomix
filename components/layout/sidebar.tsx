import Link from "next/link";
import {
  Bot,
} from "lucide-react";

import { Brain } from "lucide-react";

import {
  LayoutDashboard,
  FolderOpen,
  ShieldAlert,
  KanbanSquare,
  FileText,
  Upload,
  Activity,
  Users,
} from "lucide-react";

import {
  Clock3,
} from "lucide-react";

interface Props {
  role?: string;
}

export default function Sidebar({
  role = "VIEWER",
}: Props) {
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: [
        "ADMIN",
        "SECURITY_LEAD",
        "CONSULTANT",
        "DEVELOPER",
        "VIEWER",
      ],
    },

    {
      href: "/projects",
      label: "Projects",
      icon: FolderOpen,
      roles: [
        "ADMIN",
        "SECURITY_LEAD",
        "CONSULTANT",
        "DEVELOPER",
      ],
    },

    {
      href: "/findings",
      label: "Findings",
      icon: ShieldAlert,
      roles: [
        "ADMIN",
        "SECURITY_LEAD",
        "CONSULTANT",
        "DEVELOPER",
      ],
    },

    {
      href: "/my-findings",
      label: "My Findings",
      icon: ShieldAlert,
      roles: [
        "ADMIN",
        "SECURITY_LEAD",
        "CONSULTANT",
        "DEVELOPER",
      ],
    },

    {
      href: "/timeline",
      label: "Timeline",
      icon: KanbanSquare,
      roles: [
        "ADMIN",
        "SECURITY_LEAD",
        "CONSULTANT",
      ],
    },

    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
      roles: [
        "ADMIN",
        "SECURITY_LEAD",
      ],
    },

    {
      href: "/import",
      label: "Import",
      icon: Upload,
      roles: [
        "ADMIN",
        "CONSULTANT",
      ],
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
          "SECURITY_LEAD",
          "CONSULTANT",
        ],
      },

      {
        href: "/copilot",
        label: "Security Copilot",
        icon: Bot,
        roles: [
          "ADMIN",
          "SECURITY_LEAD",
          "CONSULTANT",
          "DEVELOPER"
        ]
      },

      {
        href: "/knowledge",
        label: "Knowledge Base",
        icon: Brain,
        roles: [
          "ADMIN",
          "SECURITY_LEAD",
          "CONSULTANT"
          ]
      },

      

  ];

  const visibleItems = navItems.filter(
    (item) => item.roles.includes(role)
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
      <div className="p-8 border-b border-slate-800">
        <h1
          className="
          text-4xl
          font-black
          tracking-wide
          text-yellow-400
          "
        >
          ATOMIX
        </h1>

        <p className="text-slate-500 text-sm mt-2">
          AI-Powered Pentest Platform
        </p>

        <div
          className="
          mt-4
          inline-block
          px-3
          py-1
          rounded-full
          bg-cyan-500/10
          text-cyan-400
          text-xs
          "
        >
          {role}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                text-slate-300
                hover:bg-slate-900
                hover:text-cyan-400
                transition-all
                duration-200
                "
              >
                <Icon size={18} />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className="
        p-4
        border-t
        border-slate-800
        "
      >
        <div
          className="
          bg-slate-900
          border
          border-cyan-500/20
          rounded-2xl
          p-4
          "
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity
              size={18}
              className="text-cyan-400"
            />

            <span className="text-sm font-semibold">
              Platform Status
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">
                Version
              </span>

              <span className="text-cyan-400">
                v1.0
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Mode
              </span>

              <span className="text-green-400">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}