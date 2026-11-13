"use client";

import { useEffect, useRef } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/system/field";
import { PanelSection } from "@/components/system/panel-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_TASK_TIERS,
  MAX_TIER_NAME_LENGTH,
  createTier,
  sanitizeAmountInput,
  starterTiers,
  type CompensationTerms,
  type TierDraft,
} from "@/lib/campaign-math";
import { cn } from "@/lib/utils";
import type { CampaignCompensationModel } from "@/types/backend";

export interface CampaignSettingsDraft extends CompensationTerms {
  title: string;
  projectCode: string;
  description: string;
}

const FLAT_FIELD =
  "h-11 rounded-none border-0 border-b border-slate-300 bg-transparent px-0 focus-visible:border-slate-900 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:ring-0";

const TIER_GRID = "grid grid-cols-[minmax(0,1fr)_7.5rem_2rem] items-center gap-x-4";

const COLUMN_LABEL = "text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase";

const MODELS: { value: CampaignCompensationModel; label: string; hint: string }[] = [
  {
    value: "PER_TASK",
    label: "Task-Based",
    hint: "Net payable = tasks × campaign rate + bonus − deduction. One rate for every annotator.",
  },
  {
    value: "FIXED",
    label: "Fixed Retainer",
    hint: "Net payable = fixed stipend + bonus − deduction. Task counts are not used.",
  },
  {
    value: "HYBRID_TIERED",
    label: "Tiered",
    hint: "Net payable = tasks × tier rate + bonus − deduction. Each annotator is assigned one tier.",
  },
];

function toFixedAmount(value: string): string | null {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

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

function AmountField({
  id,
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label} hint={hint} required>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
        onBlur={() => {
          const formatted = toFixedAmount(value);
          if (formatted !== null && formatted !== value) onChange(formatted);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(FLAT_FIELD, "font-mono tabular")}
      />
    </Field>
  );
}

function TierBuilder({
  tiers,
  onChange,
}: {
  tiers: TierDraft[];
  onChange: (tiers: TierDraft[]) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const focusIndex = useRef<number | null>(null);
  const canRemove = tiers.length > 1;
  const canAdd = tiers.length < MAX_TASK_TIERS;

  useEffect(() => {
    if (focusIndex.current === null) return;
    const inputs = listRef.current?.querySelectorAll<HTMLInputElement>("input[data-tier-name]");
    inputs?.[Math.min(focusIndex.current, inputs.length - 1)]?.focus();
    focusIndex.current = null;
  }, [tiers.length]);

  function update(id: string, patch: Partial<Omit<TierDraft, "id">>) {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)));
  }

  function add() {
    focusIndex.current = tiers.length;
    onChange([...tiers, createTier()]);
  }

  function remove(index: number) {
    focusIndex.current = Math.max(0, index - 1);
    onChange(tiers.filter((_, i) => i !== index));
  }

  return (
    <div role="group" aria-labelledby="campaign-tiers-label" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p
          id="campaign-tiers-label"
          className="text-foreground flex items-center gap-2 text-sm leading-none font-medium"
        >
          Compensation Tiers
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        </p>
        <span className="font-mono text-xs text-slate-400 tabular">
          {tiers.length} / {MAX_TASK_TIERS}
        </span>
      </div>

      <div className={TIER_GRID} aria-hidden>
        <span className={COLUMN_LABEL}>Tier Name</span>
        <span className={cn(COLUMN_LABEL, "text-right")}>Rate (ETB)</span>
        <span />
      </div>

      <ul ref={listRef} className="space-y-1">
        {tiers.map((tier, index) => {
          const position = index + 1;
          return (
            <li key={tier.id} className={TIER_GRID}>
              <Input
                data-tier-name
                value={tier.tierName}
                onChange={(e) => update(tier.id, { tierName: e.target.value })}
                maxLength={MAX_TIER_NAME_LENGTH}
                placeholder="Tier name"
                aria-label={`Tier ${position} name`}
                autoComplete="off"
                className={FLAT_FIELD}
              />
              <Input
                inputMode="decimal"
                value={tier.rateEtb}
                onChange={(e) => update(tier.id, { rateEtb: sanitizeAmountInput(e.target.value) })}
                onBlur={() => {
                  const formatted = toFixedAmount(tier.rateEtb);
                  if (formatted !== null && formatted !== tier.rateEtb) {
                    update(tier.id, { rateEtb: formatted });
                  }
                }}
                placeholder="0.00"
                aria-label={`Tier ${position} rate per task in ETB`}
                autoComplete="off"
                className={cn(FLAT_FIELD, "text-right font-mono tabular")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={!canRemove}
                aria-label={`Remove tier ${tier.tierName.trim() || position}`}
                className="text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!canAdd}>
          <Plus className="size-3.5" aria-hidden />
          Add Tier
        </Button>
        <p className="text-muted-foreground text-xs">
          The first tier is the default for newly enrolled annotators.
        </p>
      </div>
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

  function changeModel(model: CampaignCompensationModel) {
    if (model === "HYBRID_TIERED" && value.taskTiers.length === 0) {
      onChange({ model, taskTiers: starterTiers() });
    } else {
      onChange({ model });
    }
  }

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
          <ModelPicker value={value.model} onChange={changeModel} />
          <p className="text-muted-foreground text-xs">{activeModel.hint}</p>
        </div>

        {value.model === "HYBRID_TIERED" ? (
          <TierBuilder tiers={value.taskTiers} onChange={(taskTiers) => onChange({ taskTiers })} />
        ) : value.model === "FIXED" ? (
          <AmountField
            id="campaign-default-fixed"
            label="Default Fixed Stipend (ETB)"
            hint="Applied as the starting flat stipend for enrolled annotators."
            value={value.defaultFixedAmount}
            placeholder="0.00"
            onChange={(defaultFixedAmount) => onChange({ defaultFixedAmount })}
          />
        ) : (
          <AmountField
            id="campaign-default-rate"
            label="Default Rate Per Task (ETB)"
            hint="This rate is locked across every annotator in this run."
            value={value.defaultRate}
            placeholder="100.00"
            onChange={(defaultRate) => onChange({ defaultRate })}
          />
        )}

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
