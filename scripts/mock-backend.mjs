// Throwaway stub server matching FRONTEND_API_INTEGRATION_GUIDE.md closely enough
// to smoke-test the real frontend end-to-end without the actual contract-engine-backend.
// Not part of the shipped app. Run: node scripts/mock-backend.mjs
import { createServer } from "node:http";
import crypto from "node:crypto";

const PORT = 5000;
const ORIGIN = "http://localhost:3000";

const users = [
  { id: "u_hr", email: "hr-reviewer@rdgroup.et", password: "Password123!", fullName: "HR Reviewer (seeded)", role: "HR_REVIEWER" },
  { id: "u_fin", email: "finance@rdgroup.et", password: "Password123!", fullName: "Finance (seeded)", role: "FINANCE" },
  { id: "u_admin", email: "admin@rdgroup.et", password: "AdminPassword123!", fullName: "Admin (seeded)", role: "ADMIN" },
];
const sessions = new Map(); // token -> userId
const contracts = new Map(); // id -> record
let sequence = 0;

const FAKE_PDF = Buffer.from("%PDF-1.4 fake contract pdf for local testing\n%%EOF");
const FAKE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

function requestId() {
  return "req_" + crypto.randomBytes(8).toString("hex");
}
function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function ok(res, status, data, message) {
  send(res, status, { success: true, data, ...(message ? { message } : {}), requestId: requestId() });
}
function fail(res, status, code, message, details) {
  send(res, status, { success: false, error: { code, message, ...(details ? { details } : {}) }, requestId: requestId() });
}
function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(json);
}
function sendBlob(res, status, buffer, contentType, disposition, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Disposition": disposition,
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...extraHeaders,
  });
  res.end(buffer);
}

function getBearer(req) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
function requireStaff(req, res, roles) {
  const token = getBearer(req);
  const userId = token && sessions.get(token);
  const user = userId && users.find((u) => u.id === userId);
  if (!user) {
    fail(res, 401, "UNAUTHORIZED", "Missing or invalid credentials");
    return null;
  }
  if (!roles.includes(user.role)) {
    fail(res, 403, "FORBIDDEN", "You do not have access to this resource");
    return null;
  }
  return user;
}
function findContractByWorkerToken(token) {
  return [...contracts.values()].find((c) => c.workerToken === token);
}

function nextContractNumber() {
  sequence += 1;
  const yy = new Date().getFullYear().toString().slice(-2);
  return `R&D/EOC/InnC/${String(sequence).padStart(4, "0")}/${yy}`;
}

function toListItem(c) {
  const latest = c.attempts[c.attempts.length - 1];
  return {
    contractId: c.id,
    contractNumber: c.contractNumber,
    status: c.status,
    candidateName: latest?.submittedData.fullNameEnglish,
    phone: c.phone,
    currentAttemptNumber: c.currentAttemptNumber,
    bankAccountMasked: latest ? "****" : undefined,
    bankName: latest?.submittedData.bankName,
    submittedAt: latest?.createdAt,
    createdAt: c.createdAt,
  };
}
function toFinanceListItem(c) {
  const latest = c.attempts[c.attempts.length - 1];
  const masked = latest
    ? latest.submittedData.bankAccountNumber.replace(/^(\d{4}).*(\d{3})$/, "$1******$2")
    : undefined;
  return {
    contractId: c.id,
    contractNumber: c.contractNumber,
    status: c.status,
    workerName: latest?.submittedData.fullNameEnglish,
    workerNameAmharic: latest?.submittedData.fullNameAmharic,
    phone: c.phone,
    bankName: latest?.submittedData.bankName,
    bankAccountMasked: masked,
    ratePerTaskEtb: c.ratePerTaskEtb,
    agreementDate: c.agreementDate,
    signedAt: c.approvedAt,
    documentHash: c.documentHash,
    hasSealedDocument: !!c.sealedPdfBuffer,
  };
}
function toDossier(c) {
  return {
    contractId: c.id,
    contractNumber: c.contractNumber,
    status: c.status,
    roleTitle: c.roleTitle,
    ratePerTaskEtb: c.ratePerTaskEtb,
    phone: c.phone,
    currentAttemptNumber: c.currentAttemptNumber,
    maxAttempts: c.maxAttempts,
    remainingAttempts: c.maxAttempts - c.currentAttemptNumber,
    attempts: c.attempts.map((a) => ({
      attemptId: a.attemptId,
      attemptNumber: a.attemptNumber,
      status: a.status,
      submittedData: a.submittedData,
      faydaFrontSha256: a.faydaFrontSha256,
      faydaBackSha256: a.faydaBackSha256,
      reviewerId: a.reviewerId,
      reviewedAt: a.reviewedAt,
      rejectionCategory: a.rejectionCategory,
      rejectionReasonEnglish: a.rejectionReasonEnglish,
      rejectionReasonAmharic: a.rejectionReasonAmharic,
      createdAt: a.createdAt,
    })),
    idCardUrls: {
      front: `/api/v1/reviewer/contracts/${c.id}/id-card/front`,
      back: `/api/v1/reviewer/contracts/${c.id}/id-card/back`,
    },
    approvedBy: c.approvedBy,
    approvedAt: c.approvedAt,
  };
}
function toWorkerView(c) {
  return {
    contractNumber: c.contractNumber,
    status: c.status,
    roleTitle: c.roleTitle,
    ratePerTaskEtb: c.ratePerTaskEtb,
    agreementDate: c.agreementDate,
    expiresAt: c.expiresAt,
    documentUrl: "/api/v1/worker/me/document",
    currentAttemptNumber: c.currentAttemptNumber,
    maxAttempts: c.maxAttempts,
  };
}

function paginate(items, page, limit) {
  const start = (page - 1) * limit;
  const pageItems = items.slice(start, start + limit);
  return {
    items: pageItems,
    page,
    limit,
    total: items.length,
    totalPages: Math.max(Math.ceil(items.length / limit), 1),
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const buf = await readBody(req);
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString("utf-8"));
  } catch {
    return {};
  }
}

async function readMultipart(req) {
  const buf = await readBody(req);
  const contentType = req.headers["content-type"] ?? "";
  const request = new Request("http://local/", {
    method: "POST",
    headers: { "content-type": contentType },
    body: buf,
  });
  return request.formData();
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (url.pathname === "/health") {
      send(res, 200, { status: "ok" });
      return;
    }

    if (parts[0] !== "api" || parts[1] !== "v1") {
      fail(res, 404, "NOT_FOUND", "No such route");
      return;
    }
    const seg = parts.slice(2); // e.g. ["auth","login"]

    // ---- Auth ----
    if (seg[0] === "auth" && seg[1] === "login" && req.method === "POST") {
      const { email, password } = await readJson(req);
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) return fail(res, 401, "UNAUTHORIZED", "Invalid email or password");
      const token = "staff_" + crypto.randomBytes(24).toString("hex");
      sessions.set(token, user.id);
      const safeUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
      ok(res, 200, { token, user: { ...safeUser, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _id: user.id } });
      return;
    }
    if (seg[0] === "auth" && seg[1] === "me" && req.method === "GET") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "FINANCE", "ADMIN"]);
      if (!user) return;
      const safeUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
      ok(res, 200, { user: { ...safeUser, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _id: user.id } });
      return;
    }

    // ---- Finance ----
    if (seg[0] === "finance" && seg[1] === "contracts" && seg.length === 2 && req.method === "POST") {
      const user = requireStaff(req, res, ["FINANCE", "ADMIN"]);
      if (!user) return;
      const form = await readMultipart(req);
      const phone = form.get("phone");
      const pdfFile = form.get("contractPdf");
      if (!phone || !pdfFile) return fail(res, 400, "VALIDATION_ERROR", "phone and contractPdf are required");
      const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

      const id = crypto.randomUUID();
      const workerToken = crypto.randomBytes(32).toString("hex");
      const contractNumber = form.get("contractNumber") || nextContractNumber();
      if ([...contracts.values()].some((c) => c.contractNumber === contractNumber)) {
        return fail(res, 409, "CONFLICT", "contractNumber already exists");
      }
      const expiresInHours = Number(form.get("expiresInHours")) || 168;
      const expiresAt = new Date(Date.now() + expiresInHours * 3600_000).toISOString();

      contracts.set(id, {
        id,
        contractNumber,
        phone,
        status: "INVITED",
        roleTitle: "Task-Based Data Annotation Worker",
        ratePerTaskEtb: Number(form.get("ratePerTaskEtb")) || 100,
        agreementDate: new Date().toISOString(),
        expiresAt,
        createdAt: new Date().toISOString(),
        contractPdfBuffer: pdfBuffer,
        workerToken,
        currentAttemptNumber: 0,
        maxAttempts: 3,
        attempts: [],
      });

      ok(res, 201, {
        contractId: id,
        contractNumber,
        status: "INVITED",
        workerAccessToken: workerToken,
        inviteLink: `/sign/${workerToken}`,
        expiresAt,
      });
      return;
    }
    if (seg[0] === "finance" && seg[1] === "contracts" && seg.length === 2 && req.method === "GET") {
      const user = requireStaff(req, res, ["FINANCE", "ADMIN"]);
      if (!user) return;
      const status = url.searchParams.get("status") ?? "SIGNED";
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
      const items = [...contracts.values()]
        .filter((c) => c.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toFinanceListItem);
      ok(res, 200, paginate(items, page, limit));
      return;
    }
    if (seg[0] === "finance" && seg[1] === "contracts" && seg[3] === "document" && req.method === "GET") {
      const user = requireStaff(req, res, ["FINANCE", "ADMIN"]);
      if (!user) return;
      const c = contracts.get(seg[2]);
      if (!c) return fail(res, 404, "NOT_FOUND", "No such contract");
      if (c.status !== "SIGNED") return fail(res, 400, "INVALID_STATE_TRANSITION", "Contract is not signed");
      sendBlob(res, 200, c.sealedPdfBuffer ?? FAKE_PDF, "application/pdf", `attachment; filename="${c.contractNumber}.pdf"`, {
        "X-Document-Sha256": c.documentHash ?? "",
      });
      return;
    }
    if (seg[0] === "finance" && seg[1] === "contracts" && seg[2] === "export-payroll" && req.method === "GET") {
      const user = requireStaff(req, res, ["FINANCE", "ADMIN"]);
      if (!user) return;
      const rows = [...contracts.values()].filter((c) => c.status === "SIGNED");
      const header = "Contract Number,Full Name (English),Full Name (Amharic),Phone Number,Bank Name,Bank Account Number,Rate (ETB),Agreement Date,Signed Date,Document Hash";
      const lines = rows.map((c) => {
        const latest = c.attempts[c.attempts.length - 1];
        return [
          c.contractNumber,
          latest?.submittedData.fullNameEnglish ?? "",
          latest?.submittedData.fullNameAmharic ?? "",
          `'${c.phone}`,
          latest?.submittedData.bankName ?? "",
          latest?.submittedData.bankAccountNumber ?? "",
          c.ratePerTaskEtb,
          c.agreementDate,
          c.approvedAt ?? "",
          c.documentHash ?? "",
        ].join(",");
      });
      const csv = "﻿" + [header, ...lines].join("\r\n") + "\r\n";
      const today = new Date().toISOString().slice(0, 10);
      sendBlob(res, 200, Buffer.from(csv, "utf-8"), "text/csv; charset=utf-8", `attachment; filename="payroll_export_${today}.csv"`, {
        "X-Row-Count": String(rows.length),
      });
      return;
    }

    // ---- Worker ----
    if (seg[0] === "worker" && seg[1] === "me" && seg.length === 2 && req.method === "GET") {
      const token = getBearer(req);
      const c = token && findContractByWorkerToken(token);
      if (!c) return fail(res, 401, "UNAUTHORIZED", "Invalid or expired link");
      if (c.status === "INVITED") c.status = "VIEWED";
      ok(res, 200, toWorkerView(c));
      return;
    }
    if (seg[0] === "worker" && seg[1] === "me" && seg[2] === "document" && req.method === "GET") {
      const token = getBearer(req);
      const c = token && findContractByWorkerToken(token);
      if (!c) return fail(res, 401, "UNAUTHORIZED", "Invalid or expired link");
      sendBlob(res, 200, c.contractPdfBuffer, "application/pdf", 'inline; filename="contract.pdf"', {
        "Cache-Control": "private, no-store",
      });
      return;
    }
    if (seg[0] === "worker" && seg[1] === "me" && seg[2] === "submit" && req.method === "POST") {
      const token = getBearer(req);
      const c = token && findContractByWorkerToken(token);
      if (!c) return fail(res, 401, "UNAUTHORIZED", "Invalid or expired link");
      if (!["VIEWED", "RESUBMISSION_REQUIRED"].includes(c.status)) {
        return fail(res, 400, "INVALID_STATE_TRANSITION", "Your submission is already under review");
      }
      const form = await readMultipart(req);
      const fullNameEnglish = form.get("fullNameEnglish");
      const residenceLocation = form.get("residenceLocation");
      const bankName = form.get("bankName");
      const bankAccountNumber = form.get("bankAccountNumber");
      const front = form.get("faydaFront");
      const back = form.get("faydaBack");
      const issues = [];
      if (!fullNameEnglish || fullNameEnglish.length < 2) issues.push({ path: "fullNameEnglish", message: "fullNameEnglish must be at least 2 characters" });
      if (!residenceLocation || residenceLocation.length < 2) issues.push({ path: "residenceLocation", message: "residenceLocation must be at least 2 characters" });
      if (!bankName || bankName.length < 2) issues.push({ path: "bankName", message: "bankName must be at least 2 characters" });
      if (!bankAccountNumber || bankAccountNumber.length < 6) issues.push({ path: "bankAccountNumber", message: "bankAccountNumber must be at least 6 characters" });
      if (!front || !back) issues.push({ path: "faydaFront/faydaBack", message: "both ID photos are required" });
      if (issues.length) return fail(res, 400, "VALIDATION_ERROR", "Request validation failed", { issues });

      const frontBuf = Buffer.from(await front.arrayBuffer());
      const backBuf = Buffer.from(await back.arrayBuffer());
      c.currentAttemptNumber += 1;
      c.attempts.push({
        attemptId: crypto.randomUUID(),
        attemptNumber: c.currentAttemptNumber,
        status: "PENDING_REVIEW",
        submittedData: {
          fullNameEnglish,
          fullNameAmharic: form.get("fullNameAmharic") || undefined,
          residenceLocation,
          bankName,
          bankAccountNumber,
        },
        faydaFrontBuffer: frontBuf,
        faydaBackBuffer: backBuf,
        faydaFrontSha256: sha256(frontBuf),
        faydaBackSha256: sha256(backBuf),
        createdAt: new Date().toISOString(),
      });
      c.status = "PENDING_REVIEW";
      ok(res, 200, { status: "PENDING_REVIEW", attemptNumber: c.currentAttemptNumber }, "Contract details and Fayda ID submitted successfully for review");
      return;
    }
    if (seg[0] === "worker" && seg[1] === "me" && seg[2] === "download" && req.method === "GET") {
      const token = getBearer(req);
      const c = token && findContractByWorkerToken(token);
      if (!c) return fail(res, 401, "UNAUTHORIZED", "Invalid or expired link");
      if (c.status !== "SIGNED") return fail(res, 400, "INVALID_STATE_TRANSITION", "Not yet signed");
      sendBlob(res, 200, c.sealedPdfBuffer ?? FAKE_PDF, "application/pdf", `attachment; filename="Signed_Agreement_${c.contractNumber.replace(/\W+/g, "_")}.pdf"`, {
        "X-Document-Sha256": c.documentHash ?? "",
      });
      return;
    }

    // ---- Reviewer ----
    if (seg[0] === "reviewer" && seg[1] === "contracts" && seg.length === 2 && req.method === "GET") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "ADMIN"]);
      if (!user) return;
      const status = url.searchParams.get("status");
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
      let items = [...contracts.values()];
      if (status) items = items.filter((c) => c.status === status);
      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      ok(res, 200, paginate(items.map(toListItem), page, limit));
      return;
    }
    if (seg[0] === "reviewer" && seg[1] === "contracts" && seg.length === 3 && req.method === "GET") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "ADMIN"]);
      if (!user) return;
      const c = contracts.get(seg[2]);
      if (!c) return fail(res, 404, "NOT_FOUND", "No such contract");
      ok(res, 200, toDossier(c));
      return;
    }
    if (seg[0] === "reviewer" && seg[1] === "contracts" && seg[3] === "id-card" && req.method === "GET") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "ADMIN"]);
      if (!user) return;
      const c = contracts.get(seg[2]);
      if (!c) return fail(res, 404, "NOT_FOUND", "No such contract");
      const side = seg[4];
      if (side !== "front" && side !== "back") return fail(res, 400, "VALIDATION_ERROR", "side must be front or back");
      const latest = c.attempts[c.attempts.length - 1];
      const buf = (side === "front" ? latest?.faydaFrontBuffer : latest?.faydaBackBuffer) ?? FAKE_PNG;
      sendBlob(res, 200, buf, "image/png", `inline; filename="fayda-${side}"`, { "Cache-Control": "private, no-store" });
      return;
    }
    if (seg[0] === "reviewer" && seg[1] === "contracts" && seg[3] === "approve" && req.method === "POST") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "ADMIN"]);
      if (!user) return;
      const c = contracts.get(seg[2]);
      if (!c) return fail(res, 404, "NOT_FOUND", "No such contract");
      if (c.status !== "PENDING_REVIEW") return fail(res, 400, "INVALID_STATE_TRANSITION", "Contract is not pending review");
      const latest = c.attempts[c.attempts.length - 1];
      latest.status = "APPROVED";
      latest.reviewerId = user.id;
      latest.reviewedAt = new Date().toISOString();
      c.approvedBy = user.id;
      c.approvedAt = new Date().toISOString();
      c.status = "SIGNED";
      c.sealedPdfBuffer = c.contractPdfBuffer;
      c.documentHash = sha256(Buffer.concat([c.contractPdfBuffer, Buffer.from(c.id)]));
      ok(res, 200, { status: "SIGNED", attemptNumber: latest.attemptNumber, documentHash: c.documentHash, snapshotHash: sha256(Buffer.from(JSON.stringify(latest.submittedData))) }, "Contract verification approved successfully");
      return;
    }
    if (seg[0] === "reviewer" && seg[1] === "contracts" && seg[3] === "reject" && req.method === "POST") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "ADMIN"]);
      if (!user) return;
      const c = contracts.get(seg[2]);
      if (!c) return fail(res, 404, "NOT_FOUND", "No such contract");
      if (c.status !== "PENDING_REVIEW") return fail(res, 400, "INVALID_STATE_TRANSITION", "Contract is not pending review");
      const body = await readJson(req);
      if (!body.rejectionCategory || !body.rejectionReasonEnglish || body.rejectionReasonEnglish.length < 3) {
        return fail(res, 400, "VALIDATION_ERROR", "rejectionCategory and rejectionReasonEnglish are required");
      }
      const latest = c.attempts[c.attempts.length - 1];
      latest.status = "REJECTED";
      latest.reviewerId = user.id;
      latest.reviewedAt = new Date().toISOString();
      latest.rejectionCategory = body.rejectionCategory;
      latest.rejectionReasonEnglish = body.rejectionReasonEnglish;
      latest.rejectionReasonAmharic = body.rejectionReasonAmharic;
      const remaining = c.maxAttempts - c.currentAttemptNumber;
      c.status = remaining > 0 ? "RESUBMISSION_REQUIRED" : "REJECTED";
      ok(res, 200, { status: c.status, rejectionCategory: body.rejectionCategory, attemptNumber: latest.attemptNumber, remainingAttempts: remaining }, "Contract verification rejected with feedback");
      return;
    }
    if (seg[0] === "reviewer" && seg[1] === "contracts" && seg[3] === "retry-sealing" && req.method === "POST") {
      const user = requireStaff(req, res, ["HR_REVIEWER", "ADMIN"]);
      if (!user) return;
      const c = contracts.get(seg[2]);
      if (!c) return fail(res, 404, "NOT_FOUND", "No such contract");
      if (c.status !== "PDF_GENERATION_FAILED") return fail(res, 400, "INVALID_STATE_TRANSITION", "Not awaiting sealing");
      c.status = "SIGNED";
      c.sealedPdfBuffer = c.contractPdfBuffer;
      c.documentHash = sha256(c.contractPdfBuffer);
      ok(res, 200, { status: "SIGNED", documentHash: c.documentHash });
      return;
    }

    fail(res, 404, "NOT_FOUND", "No such route");
  } catch (err) {
    console.error(err);
    fail(res, 500, "INTERNAL_SERVER_ERROR", "Unexpected error");
  }
});

server.listen(PORT, () => {
  console.log(`Mock contract-engine-backend listening on http://localhost:${PORT}`);
});
