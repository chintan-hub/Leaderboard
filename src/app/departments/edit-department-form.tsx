"use client";

import { useActionState, useState } from "react";
import { updateDepartment } from "@/lib/actions/departments";
import { FormError } from "@/components/ui";

interface DepartmentSettings {
  id: string;
  name: string;
  scoringRule: string;
  rankingMetric: string;
  productionTrackingEnabled: boolean;
  reworkTrackingEnabled: boolean;
}

export default function EditDepartmentForm({ department }: { department: DepartmentSettings }) {
  const [state, formAction, pending] = useActionState(updateDepartment, {});
  const [productionTrackingEnabled, setProductionTrackingEnabled] = useState(
    department.productionTrackingEnabled,
  );
  const [reworkTrackingEnabled, setReworkTrackingEnabled] = useState(
    department.reworkTrackingEnabled,
  );

  return (
    <form action={formAction} className="space-y-4 border-t border-border pt-4">
      <input type="hidden" name="id" value={department.id} />
      <input
        type="hidden"
        name="productionTrackingEnabled"
        value={productionTrackingEnabled ? "true" : "false"}
      />
      <input
        type="hidden"
        name="reworkTrackingEnabled"
        value={reworkTrackingEnabled ? "true" : "false"}
      />

      <div>
        <label htmlFor={`name-${department.id}`} className="block text-sm font-medium text-foreground">
          Department name
        </label>
        <input
          id={`name-${department.id}`}
          name="name"
          required
          minLength={2}
          defaultValue={department.name}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Scoring Method</legend>
        <div className="mt-1 space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="scoringRule"
              value="NET_PRODUCTION"
              defaultChecked={department.scoringRule === "NET_PRODUCTION"}
            />
            Net Production — completed cases minus department-caused returns
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="scoringRule"
              value="MANUAL_POINTS_ONLY"
              defaultChecked={department.scoringRule === "MANUAL_POINTS_ONLY"}
            />
            Manual Points Only — production is logged but doesn&apos;t affect the score
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Department Ranking</legend>
        <div className="mt-1 space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="rankingMetric"
              value="AVG_NET_PER_EMPLOYEE"
              defaultChecked={department.rankingMetric === "AVG_NET_PER_EMPLOYEE"}
            />
            Average Net Production per Employee
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="rankingMetric"
              value="TOTAL_NET_PRODUCTION"
              defaultChecked={department.rankingMetric === "TOTAL_NET_PRODUCTION"}
            />
            Total Net Production
          </label>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={productionTrackingEnabled}
            onChange={(e) => setProductionTrackingEnabled(e.target.checked)}
          />
          Production tracking enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={reworkTrackingEnabled}
            onChange={(e) => setReworkTrackingEnabled(e.target.checked)}
          />
          Rework tracking enabled
        </label>
      </div>

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
