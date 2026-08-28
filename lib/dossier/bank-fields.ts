import type { ContractDossierDto } from "@/types/backend";

export function extractDossierBankFields(dossier: ContractDossierDto) {
  const latestAttempt = dossier.attempts?.[dossier.attempts.length - 1];

  const bankName =
    dossier.contract?.workerProfile?.bankName ||
    latestAttempt?.submittedData?.bankName ||
    dossier.submittedData?.bankName ||
    dossier.bankName ||
    "—";

  const bankAccountHolderName =
    dossier.contract?.workerProfile?.bankAccountHolderName ||
    latestAttempt?.submittedData?.bankAccountHolderName ||
    dossier.submittedData?.bankAccountHolderName ||
    dossier.bankAccountHolderName ||
    "—";

  const bankAccountNumber =
    dossier.contract?.workerProfile?.bankAccountNumber ||
    latestAttempt?.submittedData?.bankAccountNumber ||
    dossier.submittedData?.bankAccountNumber ||
    dossier.bankAccountNumber ||
    "—";

  return { bankName, bankAccountHolderName, bankAccountNumber };
}
