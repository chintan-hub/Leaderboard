"use client";

import { useActionState, useState } from "react";
import { updateDepartment } from "@/lib/actions/departments";
import { Field, FormError, PrimaryButton, TextInput } from "@/components/ui";

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

      <Field label="Department name" htmlFor={`name-${department.id}`}>
        <TextInput id={`name-${department.id}`} name="name" required minLength={2} defaultValue={department.name} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Scoring Method</legend>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-hover has-checked:border-brand has-checked:bg-brand-tint">
            <input
              type="radio"
              name="scoringRule"
              value="NET_PRODUCTION"
              defaultChecked={department.scoringRule === "NET_PRODUCTION"}
              className="mt-0.5 accent-brand"
            />
            <span>Net Production — completed cases minus department-caused returns</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-hover has-checked:border-brand has-checked:bg-brand-tint">
            <input
              type="radio"
              name="scoringRule"
              value="MANUAL_POINTS_ONLY"
              defaultChecked={department.scoringRule === "MANUAL_POINTS_ONLY"}
              className="mt-0.5 accent-brand"
            />
            <span>Manual Points Only — production is logged but doesn&apos;t affect the score</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Department Ranking</legend>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-hover has-checked:border-brand has-checked:bg-brand-tint">
            <input
              type="radio"
              name="rankingMetric"
              value="AVG_NET_PER_EMPLOYEE"
              defaultChecked={department.rankingMetric === "AVG_NET_PER_EMPLOYEE"}
              className="accent-brand"
            />
            Average Net Production per Employee
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-hover has-checked:border-brand has-checked:bg-brand-tint">
            <input
              type="radio"
              name="rankingMetric"
              value="TOTAL_NET_PRODUCTION"
              defaultChecked={department.rankingMetric === "TOTAL_NET_PRODUCTION"}
              className="accent-brand"
            />
            Total Net Production
          </label>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={productionTrackingEnabled}
            onChange={(e) => setProductionTrackingEnabled(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Production tracking enabled
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={reworkTrackingEnabled}
            onChange={(e) => setReworkTrackingEnabled(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Rework tracking enabled
        </label>
      </div>

      <FormError message={state.error} />

      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </PrimaryButton>
    </form>
  );
}
