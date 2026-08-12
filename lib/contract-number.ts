import { promises as fs } from "fs";
import path from "path";

const COUNTER_FILE = path.join(process.cwd(), "data", "contract-counter.json");

/**
 * File-based sequence so every signed contract gets a new, single
 * "R&D/EOC/InnC/0001/26"-style number. This is a placeholder store for
 * local/dev use — on a serverless host (e.g. Vercel) the filesystem is
 * ephemeral and not shared across instances, so numbers can repeat or
 * reset. Swap this for a backend-issued sequence (e.g. via CONTRACT_API_URL)
 * before relying on it in production.
 */
export async function nextContractNumber(signedAt: Date): Promise<string> {
  let lastSequence = 0;
  try {
    const raw = await fs.readFile(COUNTER_FILE, "utf-8");
    lastSequence = JSON.parse(raw).lastSequence ?? 0;
  } catch {
    lastSequence = 0;
  }

  const sequence = lastSequence + 1;
  await fs.mkdir(path.dirname(COUNTER_FILE), { recursive: true });
  await fs.writeFile(COUNTER_FILE, JSON.stringify({ lastSequence: sequence }), "utf-8");

  const yy = String(signedAt.getFullYear()).slice(-2);
  return `R&D/EOC/InnC/${String(sequence).padStart(4, "0")}/${yy}`;
}
