import { prisma } from "../../../lib/prisma";
import AnalyzeButton from "../../../components/findings/analyze-button";
import AssignOwner from "../../../components/findings/assign-owner";
import StatusSelector from "../../../components/findings/status-selector";

import {
  ShieldAlert,
  Brain,
  Building2,
  Wrench,
  FileText,
  FolderOpen,
} from "lucide-react";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function FindingDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const finding =
    await prisma.finding.findUnique({
      where: { id },

      include: {
        owner: true,

        project: true,

        analysis: true,

        activities: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  const users =
    await prisma.user.findMany({
      where: {
        role: {
          in: [
            "DEVELOPER",
            "CONSULTANT",
          ],
        },
      },

      orderBy: {
        name: "asc",
      },
    });

  if (!finding) {
    return (
      <div className="p-8 text-white">
        Finding not found
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <ShieldAlert
            size={40}
            className="text-red-400"
          />

          <div>
            <h1 className="text-5xl font-bold text-white">
              {finding.title}
            </h1>

            <div className="flex items-center gap-2 mt-2 text-slate-400">
              <FolderOpen size={16} />

              <span>
                {finding.project.name}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <span
            className="
            px-4
            py-2
            rounded-full
            bg-red-500/20
            text-red-400
            font-semibold
            "
          >
            {finding.severity}
            <div className="mt-4">
              <StatusSelector
                findingId={finding.id}
                currentStatus={finding.status}
              />
            </div>
          </span>

          <span
            className="
            px-4
            py-2
            rounded-full
            bg-cyan-500/20
            text-cyan-400
            font-semibold
            "
          >
            {finding.status}
          </span>
        </div>
      </div>

      {/* Metadata */}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Owner
          </p>

          <h3 className="text-lg font-semibold">
            {finding.owner
              ? `${finding.owner.name} (${finding.owner.role})`
              : "Unassigned"}
          </h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            CVSS
          </p>

          <h3 className="text-lg font-semibold">
            {finding.cvssScore ??
              "N/A"}
          </h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            CWE
          </p>

          <h3 className="text-lg font-semibold">
            {finding.cweId ??
              "N/A"}
          </h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            OWASP
          </p>

          <h3 className="text-lg font-semibold">
            {finding.owaspCategory ??
              "N/A"}
          </h3>
        </div>
      </div>

      {/* Description + Remediation */}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <h3 className="text-cyan-400 font-semibold mb-4">
            Description
          </h3>

          <p className="text-slate-300 leading-7">
            {finding.description ||
              "No description available"}
          </p>
        </div>

        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <h3 className="text-cyan-400 font-semibold mb-4">
            Remediation
          </h3>

          <p className="text-slate-300 leading-7">
            {finding.remediation ||
              "No remediation guidance available"}
          </p>
        </div>
      </div>

      {/* Assign Owner */}

      <div className="mb-8">
        <AssignOwner
          findingId={finding.id}
          users={users}
        />
      </div>
      <div className="mb-8">
        <StatusSelector
          findingId={finding.id}
          currentStatus={
            finding.status
          }
        />
      </div>
      {/* AI Analysis Header */}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain
            className="text-cyan-400"
            size={28}
          />

          <h2 className="text-3xl font-bold text-white">
            AI Analysis
          </h2>
        </div>

        <AnalyzeButton
          findingId={finding.id}
        />
      </div>

      {/* AI Analysis */}

      <div
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-8
        mb-8
        "
      >
        {finding.analysis ? (
          <>
            <div
              className="
              mb-8
              bg-cyan-500/10
              border
              border-cyan-500/30
              rounded-xl
              p-5
              inline-block
              "
            >
              <div className="text-slate-400">
                Risk Score
              </div>

              <div className="text-5xl font-bold text-cyan-400">
                {finding.analysis
                  .riskScore ?? "N/A"}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2
                    size={20}
                    className="text-cyan-400"
                  />

                  <h3 className="font-semibold">
                    Business Impact
                  </h3>
                </div>

                <p>
                  {finding.analysis
                    .businessImpact ||
                    "Not available"}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert
                    size={20}
                    className="text-cyan-400"
                  />

                  <h3 className="font-semibold">
                    Technical Impact
                  </h3>
                </div>

                <p>
                  {finding.analysis
                    .technicalImpact ||
                    "Not available"}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench
                    size={20}
                    className="text-cyan-400"
                  />

                  <h3 className="font-semibold">
                    Remediation Plan
                  </h3>
                </div>

                <p>
                  {finding.analysis
                    .remediationPlan ||
                    "Not available"}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText
                    size={20}
                    className="text-cyan-400"
                  />

                  <h3 className="font-semibold">
                    Executive Summary
                  </h3>
                </div>

                <p>
                  {finding.analysis
                    .executiveSummary ||
                    "Not available"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Brain
              size={48}
              className="text-slate-600 mx-auto mb-4"
            />

            <p className="text-slate-400">
              No AI analysis generated yet
            </p>
          </div>
        )}
      </div>

      {/* Activity Timeline */}

      <div
        className="
        bg-[#07111f]
        border
        border-cyan-500/20
        rounded-2xl
        p-6
        "
      >
        <h2
          className="
          text-xl
          font-semibold
          text-cyan-400
          mb-6
          "
        >
          Activity Timeline
        </h2>

        <div className="space-y-4">
          {finding.activities.map(
            (activity) => (
              <div
                key={activity.id}
                className="
                border-l-2
                border-cyan-500
                pl-4
                "
              >
                <p className="font-medium">
                  {activity.action}
                </p>

                <p className="text-sm text-slate-400">
                  {activity.actor}
                </p>

                <p className="text-sm text-slate-500">
                  {new Date(
                    activity.createdAt
                  ).toLocaleString()}
                </p>

                {activity.oldValue && (
                  <p className="text-sm">
                    {activity.oldValue}
                    {" → "}
                    {activity.newValue}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}