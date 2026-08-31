/**
 * Agreement templates pre-vaulted on the backend. The rate and legal clauses
 * live in the stored PDF, so finance picks a template rather than uploading a
 * file and re-typing the rate; the backend resolves the rest from `id`.
 */
export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  ratePerTaskEtb: number;
  pages: number;
}

export const CONTRACT_TEMPLATES: readonly ContractTemplate[] = [
  {
    id: "RD_EOC_HR_007_REV1",
    title: "R&D EOC/HR/007 Rev no-1",
    description:
      "Task-Based Data Annotation Worker Agreement (Standard · 4 Pages · 100 ETB/task)",
    ratePerTaskEtb: 100,
    pages: 4,
  },
];

export const DEFAULT_TEMPLATE_ID = CONTRACT_TEMPLATES[0].id;
