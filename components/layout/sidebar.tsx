"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BarChart3,
  FolderOpen,
  ShieldAlert,
  KanbanSquare,
  Upload,
  Users,
  UserCheck,
  Workflow,
  Clock3,
  Bot,
  Brain,
  RotateCcw,
  ClipboardList,
  FileSearch,
  Network,
  ShieldCheck,
  TerminalSquare,
  UserPlus,
} from "lucide-react";

interface Props {
  role?: string;
}

function normalizeRole(role: string) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  if (role === "DEVELOPER" || role === "VIEWER") {
    return "REVIEWER";
  }

  return role;
}

export default function Sidebar({
  role = "REVIEWER",
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
        "EXECUTIVE",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
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
      label: "Governance Portfolio",
      icon: FolderOpen,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
        "CONSULTANT",
      ],
    },
    {
      href: "/reviewers",
      label: "Reviewer Governance",
      icon: UserCheck,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "EXECUTIVE"],
    },
    {
      href: "/workflow",
      label: "Workflow",
      icon: Workflow,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
      ],
    },
    {
      href: "/retest-governance",
      label: "Retest Governance",
      icon: RotateCcw,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "EXECUTIVE"],
    },
    {
      href: "/my-findings",
      label: "My Reviews",
      icon: ShieldAlert,
      roles: ["ADMIN", "QA_REVIEWER", "REVIEWER", "VALIDATOR"],
    },
    {
      href: "/timeline",
      label: "Timeline",
      icon: KanbanSquare,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
      ],
    },
    {
      href: "/import",
      label: "Review Document Vault",
      icon: Upload,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR", "ENGAGEMENT_MANAGER"],
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
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
      ],
    },
  ];

  const agentItems = [
    {
      href: "/workflow/scope-call",
      label: "Demo Call Agent",
      icon: ClipboardList,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR", "PROJECT_MANAGER", "CONSULTANT"],
    },
    {
      href: "/workflow/peer-review",
      label: "Peer Review Agent",
      icon: FileSearch,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR", "QA_REVIEWER", "REVIEWER"],
    },
    {
      href: "/workflow/mcp-review",
      label: "MCP Review Agent",
      icon: Network,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR", "QA_REVIEWER", "REVIEWER"],
    },
    {
      href: "/workflow/reviewer-copilot",
      label: "Reviewer Copilot",
      icon: ShieldCheck,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
      ],
    },
    {
      href: "/workflow/interview-agent",
      label: "Interview Agent",
      icon: UserPlus,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "ENGAGEMENT_MANAGER",
        "PROJECT_MANAGER",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
      ],
    },
    {
      href: "/workflow/command-center",
      label: "DB Action Builder",
      icon: TerminalSquare,
      roles: ["ADMIN", "GOVERNANCE_TEAM", "VALIDATOR"],
    },
    {
      href: "/copilot",
      label: "Security Copilot",
      icon: Bot,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
      ],
    },
    {
      href: "/knowledge",
      label: "Knowledge Base",
      icon: Brain,
      roles: [
        "ADMIN",
        "GOVERNANCE_TEAM",
        "VALIDATOR",
        "QA_REVIEWER",
        "REVIEWER",
        "RETESTER",
        "PROJECT_MANAGER",
        "ENGAGEMENT_MANAGER",
      ],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(normalizedRole)
  );
  const visibleAgentItems = agentItems.filter((item) =>
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
        <Image
          src="/atomix-logo.svg"
          alt="ATOMIX"
          width={220}
          height={59}
          priority
          className="h-14 w-auto"
        />

        <p
          className="
          text-slate-500
          text-[11px]
          mt-1
          "
        >
          AI-powered Governance Dashboard
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
              pathname === item.href ||
              (item.href === "/projects" &&
                ["/projects", "/reviews", "/findings"].some((prefix) =>
                  pathname.startsWith(prefix),
                ));

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

        {visibleAgentItems.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
              Agents
            </p>

            <div className="space-y-2">
              {visibleAgentItems.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  (item.href !== "/copilot" &&
                    item.href !== "/knowledge" &&
                    pathname.startsWith(item.href));

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
                      className={active ? "text-cyan-400" : ""}
                    />

                    <span className="font-medium">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
