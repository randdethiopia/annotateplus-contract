"use client";

import { Lock } from "lucide-react";
import { Field } from "@/components/system/field";
import { PanelSection } from "@/components/system/panel-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeAmountInput } from "@/lib/campaign-math";
import { cn } from "@/lib/utils";
import type { CampaignCompensationModel } from "@/types/backend";

export interface CampaignSettingsDraft {
  title: string;
  projectCode: string;
  description: string;
  model: CampaignCompensationModel;
  defaultRate: string;
}

const FLAT_FIELD =
  "h-11 rounded-none border-0 border-b border-slate-300 bg-transparent px-0 focus-visible:border-slate-900 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:ring-0";

const MODELS: { value: CampaignCompensationModel; label: string; hint: string }[] = [
  {
    value: "PER_TASK",
    label: "Task-Based",
    hint: "Net payable = tasks × rate + bonus − deduction.",
  },
  {
    value: "FIXED",
    label: "Fixed Retainer",
    hint: "Net payable = fixed fee + bonus − deduction. Task counts are not used.",
  },
  {
    value: "HYBRID_TIERED",
    label: "Tiered",
    hint: "Each annotator's rate acts as their tier rate: tasks × rate + bonus − deduction.",
  },
];

function ModelPicker({
  value,
  onChange,
}: {
  value: CampaignCompensationModel;
  onChange: (value: CampaignCompensationModel) => void;
}) {
  return (
    // Native radios inside the pills, so arrow-key navigation and form
    // semantics come for free.
    <div
      role="radiogroup"
      aria-labelledby="campaign-model-label"
      className="flex flex-wrap items-center gap-6"
    >
      {MODELS.map((model) => {
        const checked = model.value === value;
        return (
          <label
            key={model.value}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 text-[15px] whitespace-nowrap transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-900/10",
              checked
                ? "font-semibold text-slate-900"
                : "font-normal text-slate-500 hover:text-slate-900"
            )}
          >
            <input
              type="radio"
              name="campaign-model"
              value={model.value}
              checked={checked}
              onChange={() => onChange(model.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                checked ? "border-slate-900" : "border-slate-300 bg-white"
              )}
              aria-hidden
            >
              {checked && <span className="size-1.5 rounded-full bg-slate-900" />}
            </span>
            {model.label}
          </label>
        );
      })}
    </div>
  );
}

export function CampaignSettingsSection({
  value,
  onChange,
  locked,
}: {
  value: CampaignSettingsDraft;
  onChange: (patch: Partial<CampaignSettingsDraft>) => void;
  /** A DRAFT already exists server-side and these fields cannot be edited after creation. */
  locked: boolean;
}) {
  const activeModel = MODELS.find((m) => m.value === value.model) ?? MODELS[0];
  const rateLabel = value.model === "FIXED" ? "Default Fixed Fee" : "Default Rate Per Task";

  return (
    <PanelSection
      id="campaign-settings-heading"
      label="Project & Compensation"
      description="The rules every enrolled annotator inherits for this run."
      aside={
        locked ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Lock className="size-3.5" aria-hidden />
            Saved as draft
          </span>
        ) : undefined
      }
    >
      <fieldset disabled={locked} className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        <Field id="campaign-title" label="Campaign Title" required>
          <Input
            id="campaign-title"
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="November Audio & Speech Annotation"
            autoComplete="off"
            className={FLAT_FIELD}
          />
        </Field>

        <Field id="campaign-project-code" label="Project Code" required>
          <Input
            id="campaign-project-code"
            value={value.projectCode}
            onChange={(e) => onChange({ projectCode: e.target.value.toUpperCase() })}
            placeholder="AUDIO-ETH-02"
            autoComplete="off"
            spellCheck={false}
            className={cn(FLAT_FIELD, "font-mono")}
          />
        </Field>

        <div className="space-y-1.5">
          <p id="campaign-model-label" className="text-foreground text-sm font-medium">
            Compensation Model
          </p>
          <ModelPicker value={value.model} onChange={(model) => onChange({ model })} />
          <p className="text-muted-foreground text-xs">{activeModel.hint}</p>
        </div>

        <Field
          id="campaign-default-rate"
          label={rateLabel}
          hint="Applied to every annotator unless you override their row."
        >
          <div className="relative">
            <Input
              id="campaign-default-rate"
              inputMode="decimal"
              value={value.defaultRate}
              onChange={(e) => onChange({ defaultRate: sanitizeAmountInput(e.target.value) })}
              onBlur={() => {
                const n = Number.parseFloat(value.defaultRate);
                if (Number.isFinite(n)) onChange({ defaultRate: n.toFixed(2) });
              }}
              placeholder="100.00"
              autoComplete="off"
              className={cn(FLAT_FIELD, "pr-14 font-mono tabular")}
            />
            <span
              className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 font-mono text-xs font-medium text-slate-400"
              aria-hidden
            >
              ETB
            </span>
          </div>
        </Field>

        <Field id="campaign-description" label="Description" optional className="md:col-span-2">
          <Textarea
            id="campaign-description"
            value={value.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Scope, deliverables and quality bar for this run."
            rows={3}
            className="resize-none rounded-none border-0 border-b border-slate-300 bg-transparent px-0 focus-visible:border-slate-900 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:ring-0"
          />
        </Field>
      </fieldset>
    </PanelSection>
  );
}
