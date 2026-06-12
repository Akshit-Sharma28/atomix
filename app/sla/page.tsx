import SLAKPIs from "../../components/sla/sla-kpis";

import {
  getSLAMetrics,
} from "../../services/sla/sla-dashboard.service";

import {
  AlertTriangle,
} from "lucide-react";

export default async function SLAPage() {
  const metrics =
    await getSLAMetrics();

  return (
    <div className="max-w-7xl mx-auto p-8">

      <div className="mb-8">

        <div className="flex items-center gap-4">

          <AlertTriangle
            size={40}
            className="text-orange-400"
          />

          <div>

            <h1 className="text-5xl font-bold">
              SLA Dashboard
            </h1>

            <p className="text-slate-400 mt-2">
              Vulnerability remediation tracking
            </p>

          </div>

        </div>

      </div>

      <SLAKPIs metrics={metrics} />

    </div>
  );
}