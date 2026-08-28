# Frontend Developer Integration Guide & API Contract

**System:** `contract-engine-backend` — R&D EOC/HR/007 Task-Based Worker Agreement e-signing and human-in-the-loop eKYC.

**API version:** `v1` · **Document generated from the implemented backend** (every shape below was read from the route, controller and DTO source, not from a design document).

---

## Table of contents

1. [Base URLs and response envelopes](#1-base-urls-and-response-envelopes)
2. [The three authentication models](#2-the-three-authentication-models)
3. [End-to-end workflows](#3-end-to-end-workflows)
4. [TypeScript interfaces](#4-typescript-interfaces)
5. [API endpoint reference](#5-api-endpoint-reference)
6. [State machine and UI badge colours](#6-state-machine-and-ui-badge-colours)
7. [Seeded test credentials](#7-seeded-test-credentials)
8. [Things that will bite you](#8-things-that-will-bite-you)

---

## 1. Base URLs and response envelopes

| Environment | Base URL |
|---|---|
| Local development | `http://localhost:5000` |
| All API routes | prefixed `/api/v1` |
| Health check | `GET /health` (**not** under `/api/v1`, and not enveloped) |

### Success envelope

Every JSON endpoint returns this shape. `message` appears only on action endpoints (submit, approve, reject).

```json
{
  "success": true,
  "data": { },
  "message": "Optional human-readable confirmation",
  "requestId": "req_a1b2c3d4e5f60718"
}
```

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "issues": [ { "path": "phone", "message": "phone must be at least 9 characters" } ] }
  },
  "requestId": "req_a1b2c3d4e5f60718"
}
```

**`details` is present only for operational 4xx errors.** Any 5xx returns a generic message with no `details` — do not build UI that depends on it being there. Always surface `error.message`; use `error.code` for branching.

### Error codes

| HTTP | `error.code` | When | Suggested UI |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad body/query/param. `details.issues[]` gives `path` + `message` | Inline field errors |
| 400 | `INVALID_STATE_TRANSITION` | Action illegal for the current status | Toast + refetch the record |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired credential | Redirect to login (staff) or "link expired" screen (worker) |
| 403 | `FORBIDDEN` | Authenticated but wrong role | "You do not have access" — do **not** retry |
| 404 | `NOT_FOUND` | No such record or route | Not-found state |
| 409 | `CONFLICT` | Concurrent modification, duplicate contract number | Toast "changed elsewhere", refetch |
| 413 | `PAYLOAD_TOO_LARGE` | File over 10 MB | "Photo too large" before upload if possible |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Declared MIME not allowed on that route | "Please upload a JPEG or PNG" |
| 429 | `TOO_MANY_REQUESTS` | Rate limited. `Retry-After` header in seconds | Disable the button and count down |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected | Generic error, show `requestId` for support |
| 501 | `NOT_IMPLEMENTED` | S3 driver selected but not built | Should not occur in normal operation |

### Headers to know

**Sent on every response:** `X-Request-Id` — echo it in bug reports; it ties the request to the server log and the audit ledger.

**You may send:** `X-Request-Id` matching `^[A-Za-z0-9_-]{8,64}$` to correlate your own traces. Anything malformed is silently replaced.

**Rate-limit headers:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (unix seconds), plus `Retry-After` on a 429.

### Rate limits

| Scope | Limit | Keyed by |
|---|---|---|
| Global (all routes) | 100 / min | IP |
| `POST /auth/login` | 10 / min | IP |
| `POST /worker/me/submit` | 5 / min | contract |
| `GET /finance/contracts/export-payroll` | **3 / hour** | staff user |

---

## 2. The three authentication models

All three use `Authorization: Bearer <token>`. There are **no cookies and no CSRF tokens** — the API is deliberately bearer-only, so you must store and attach the token yourself.

### 2.1 Worker — capability token

The worker never has a password or an account. They receive a link by SMS containing a 64-character hex token; that token *is* the credential.

```
Authorization: Bearer 5afbbf3d5a17b4b15fe0940aad04779318d6af492a19709a3072628eb0d868a1
```

- Extract it from the invite path `/sign/:token` and hold it for the session.
- It grants access to **exactly one contract**. There is no "list my contracts".
- It **expires** (default 168 hours). Once expired the contract moves to `EXPIRED` and every worker call returns 401.
- Treat it like a password: never log it, never put it in analytics, and prefer `sessionStorage` over `localStorage`.

> A 401 on any worker route means the same thing whether the token is unknown, expired or malformed — the API deliberately does not distinguish them. Show one "this link is no longer valid, contact HR" screen.

### 2.2 HR Reviewer — staff JWT

Obtained from `POST /auth/login`. Signed HS256, expires per `JWT_EXPIRES_IN` (default `7d`).

Accepted on `/api/v1/reviewer/*` for roles **`HR_REVIEWER`** and **`ADMIN`**. `FINANCE` is rejected with **403** — creating contracts and adjudicating identity are deliberately separated duties.

### 2.3 Finance — staff JWT *or* static API key

`/api/v1/finance/*` accepts **either**:

1. A staff JWT with role `FINANCE` or `ADMIN` — what your Finance portal should use.
2. A static `FINANCE_API_KEY` bearer — intended for server-to-server automation, not browsers. **Never ship this key to a frontend.**

**One exception:** `GET /finance/contracts/export-payroll` accepts **the JWT only**. The static key gets **403**, because that endpoint decrypts every worker's bank account and must be attributable to a named person.

| Route group | Worker token | HR/Admin JWT | Finance/Admin JWT | Static API key |
|---|---|---|---|---|
| `/api/v1/worker/*` | ✅ | — | — | — |
| `/api/v1/reviewer/*` | — | ✅ | 403 | — |
| `/api/v1/finance/*` | — | ADMIN only | ✅ | ✅ |
| `…/export-payroll` | — | ADMIN only | ✅ | **403** |

---

## 3. End-to-end workflows

### 3.1 Candidate mobile signing portal

Mobile-first. The worker arrives from an SMS link, so the entry point is a URL, not a login form.

```
SMS: "…Open: /sign/<token>"
      │
      ▼
1. Read :token from the route, store in memory/sessionStorage
      │
      ▼
2. GET /worker/me                    → status becomes VIEWED automatically
      │                                 (renders name, rate, status)
      ▼
3. GET /worker/me/document           → show the agreement PDF (inline)
      │                                 worker must be able to read before signing
      ▼
4. POST /worker/me/submit            → multipart: details + 2 ID photos
      │                                 → status PENDING_REVIEW
      ▼
5. "Under review" screen — poll GET /worker/me
      │
      ├─ status RESUBMISSION_REQUIRED → show the rejection reason, reopen step 4
      ├─ status REJECTED              → terminal, show "not approved"
      └─ status SIGNED                → GET /worker/me/download (attachment)
```

**UI notes**

- Step 2 is what flips `INVITED` → `VIEWED`. Calling it repeatedly is safe and produces only one audit event.
- Only allow step 4 when `status` is `VIEWED` or `RESUBMISSION_REQUIRED`. Anything else returns `INVALID_STATE_TRANSITION`.
- Show `currentAttemptNumber` / `maxAttempts` prominently. On the last permitted attempt, warn the worker that a further rejection is final.
- The download button appears **only** when `status === 'SIGNED'`.
- Photo capture: JPEG/PNG/WebP, minimum **300×300 px**, maximum 10 MB each. Both `faydaFront` and `faydaBack` are required in the same request.

### 3.2 HR review operations dashboard

Desktop. A work queue plus a decision screen.

```
1. POST /auth/login (hr-reviewer@…)     → store JWT
      │
      ▼
2. GET /reviewer/contracts?status=PENDING_REVIEW&page=1&limit=20
      │                                   oldest-first work queue
      ▼
3. GET /reviewer/contracts/:id           → full dossier
      │                                   ⚠ this call is AUDITED as DOSSIER_VIEWED
      ▼
4. Render side by side:
      • submitted name / residence / bank details (decrypted)
      • GET …/id-card/front  and  …/id-card/back   (authenticated images)
      │
      ├─ POST …/approve  → seals the PDF, status becomes SIGNED
      └─ POST …/reject   → category + English (+ optional Amharic) reason
                           → RESUBMISSION_REQUIRED, or REJECTED if attempts spent
```

**UI notes**

- The queue is sorted **oldest first** deliberately. Do not "helpfully" reverse it — newest-first lets a steady arrival rate starve the oldest submission forever.
- **Approve does the whole thing.** It transitions to `APPROVED`, seals the PDF, and returns `status: "SIGNED"`. Expect `SIGNED`, not `APPROVED`. If sealing fails you get `PDF_GENERATION_FAILED` plus `sealingError`; offer a "Retry sealing" button hitting `POST …/retry-sealing`.
- Loading a dossier writes an audit event. Do not prefetch dossiers for the whole queue, and do not poll one — every view is recorded against the reviewer's identity.
- ID card images need the `Authorization` header, so a bare `<img src>` will **not** work. Fetch as a blob:

```ts
const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
const objectUrl = URL.createObjectURL(await res.blob());
// remember URL.revokeObjectURL(objectUrl) on unmount
```

- Amharic rejection reasons are optional but strongly encouraged — the worker receives them by SMS. Render an Amharic-capable font (e.g. Noto Sans Ethiopic) in that textarea.

### 3.3 Finance portal

```
1. POST /auth/login (finance@…)          → store JWT
      │
      ├─ POST /finance/contracts          multipart: phone + contractPdf
      │                                   → returns workerAccessToken ONCE
      │
      ├─ GET  /finance/contracts?status=SIGNED&page=1
      │                                   → masked bank accounts
      │
      ├─ GET  /finance/contracts/:id/document
      │                                   → sealed PDF (attachment)
      │
      └─ GET  /finance/contracts/export-payroll
                                          → CSV, JWT only, 3/hour
```

**UI notes**

- `workerAccessToken` is returned **exactly once, at creation**. There is no endpoint to retrieve it again. Display it with a copy button and make clear it cannot be recovered — reissuing means creating a new contract.
- `inviteLink` comes back as a relative path (`/sign/<token>`). Prefix it with your public frontend origin before sending it to anyone.
- The list view returns **masked** accounts (`bankAccountMasked`). Full numbers exist only in the payroll CSV.
- Warn before triggering the payroll export: it is logged with the operator's identity and the row count, and is limited to 3 per hour.

---

## 4. TypeScript interfaces

Copy these verbatim; they mirror the server DTOs. Dates arrive as **ISO-8601 strings** over JSON even where the server type says `Date`.

```ts
// ============================================================
// Shared
// ============================================================

export type ContractStatus =
  | 'DRAFT'
  | 'INVITED'
  | 'VIEWED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'SIGNED'
  | 'PDF_GENERATION_FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export type UserRole = 'HR_REVIEWER' | 'FINANCE' | 'ADMIN';

export type RejectionCategory =
  | 'NAME_MISMATCH'
  | 'BLURRY_ID'
  | 'EXPIRED_ID'
  | 'MISSING_BACK_IMAGE'
  | 'INVALID_BANK_INFO'
  | 'OTHER';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  requestId: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    /** Present only for operational 4xx responses. */
    details?: Record<string, unknown>;
  };
  requestId: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================
// Auth
// ============================================================

export interface StaffUserDto {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // passwordHash and __v are stripped server-side and never present.
}

export interface LoginResponseData {
  token: string;
  user: StaffUserDto;
}

// ============================================================
// Worker portal
// ============================================================

/** GET /api/v1/worker/me */
export interface WorkerContractViewDto {
  contractNumber: string;
  status: ContractStatus;
  roleTitle: string;
  ratePerTaskEtb: number;
  agreementDate: string;
  /** Capability-token expiry. May be absent on a DRAFT. */
  expiresAt?: string;
  /** Always '/api/v1/worker/me/document'. */
  documentUrl: string;
  currentAttemptNumber: number;
  maxAttempts: number;
}

/**
 * POST /api/v1/worker/me/submit — sent as multipart/form-data.
 * NOT JSON: the two files ride in the same request.
 */
export interface WorkerSubmitPayload {
  fullNameEnglish: string;          // min 2 chars
  fullNameAmharic?: string;         // optional, min 1 char if present
  residenceLocation: string;        // min 2 chars
  bankName: string;                 // min 2 chars
  bankAccountNumber: string;        // 6–34 chars
  faydaFront: File;                 // JPEG/PNG/WebP, >=300x300, <=10 MB
  faydaBack: File;                  // same constraints
}

export interface WorkerSubmitResponseData {
  status: 'PENDING_REVIEW';
  attemptNumber: number;
}

// ============================================================
// HR reviewer
// ============================================================

/** One row of GET /api/v1/reviewer/contracts */
export interface ContractListItemDto {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  candidateName?: string;
  phone: string;
  currentAttemptNumber: number;
  /** Literal '****' in the queue — never a real number. */
  bankAccountMasked?: string;
  bankName?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface AttemptSummaryDto {
  attemptId: string;
  attemptNumber: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedData: {
    fullNameEnglish: string;
    fullNameAmharic?: string;
    residenceLocation: string;
    bankName: string;
    /**
     * DECRYPTED plaintext. May be '(not provided)' or
     * '(unavailable - decryption failed)' — render defensively.
     */
    bankAccountNumber: string;
  };
  faydaFrontSha256: string;
  faydaBackSha256: string;
  reviewerId?: string;
  reviewedAt?: string;
  rejectionCategory?: RejectionCategory;
  rejectionReasonEnglish?: string;
  rejectionReasonAmharic?: string;
  createdAt: string;
}

/** GET /api/v1/reviewer/contracts/:id */
export interface ContractDossierDto {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  roleTitle: string;
  ratePerTaskEtb: number;
  phone: string;
  currentAttemptNumber: number;
  maxAttempts: number;
  remainingAttempts: number;
  /** Full history, ascending by attemptNumber. The last entry is the live one. */
  attempts: AttemptSummaryDto[];
  /** Relative paths; both require the Authorization header. */
  idCardUrls: { front: string; back: string };
  approvedBy?: string;
  approvedAt?: string;
}

export interface ApproveResponseData {
  /** Normally 'SIGNED' — approval seals the PDF in the same action. */
  status: ContractStatus;
  attemptNumber: number;
  documentHash?: string;
  snapshotHash?: string;
  /** Present only when sealing failed; the approval still stands. */
  sealingError?: string;
}

export interface RejectPayload {
  rejectionCategory: RejectionCategory;
  rejectionReasonEnglish: string;   // 3–500 chars, required
  rejectionReasonAmharic?: string;  // 3–500 chars, optional
}

export interface RejectResponseData {
  status: 'RESUBMISSION_REQUIRED' | 'REJECTED';
  rejectionCategory: RejectionCategory;
  attemptNumber: number;
  remainingAttempts: number;
}

// ============================================================
// Finance
// ============================================================

export interface CreateContractResponseData {
  contractId: string;
  contractNumber: string;
  status: 'INVITED';
  /** Returned ONCE and never retrievable again. */
  workerAccessToken: string;
  /** Relative: '/sign/<token>'. Prefix with your public origin. */
  inviteLink: string;
  expiresAt: string;
}

export interface FinanceContractListItemDto {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  workerName?: string;
  workerNameAmharic?: string;
  phone: string;
  bankName?: string;
  /** Masked, e.g. '1000******789', or '(unavailable)'. */
  bankAccountMasked?: string;
  ratePerTaskEtb: number;
  agreementDate: string;
  signedAt?: string;
  documentHash?: string;
  hasSealedDocument: boolean;
}
```

---

## 5. API endpoint reference

### 5.1 Auth

#### `POST /api/v1/auth/login`

No auth. Rate limited **10/min per IP**.

```json
{ "email": "hr-reviewer@rdgroup.et", "password": "Password123!" }
```

**200** → `ApiSuccess<LoginResponseData>`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6a86ab0227da6d2ecadb83dd",
      "email": "hr-reviewer@rdgroup.et",
      "fullName": "HR Reviewer (seeded)",
      "role": "HR_REVIEWER",
      "isActive": true,
      "createdAt": "2026-08-20T08:00:00.000Z",
      "updatedAt": "2026-08-20T08:00:00.000Z"
    }
  },
  "requestId": "req_1a2b3c4d5e6f7081"
}
```

| Status | Meaning |
|---|---|
| 400 | Malformed email, or password under 6 chars |
| 401 | Wrong credentials, or the account is deactivated — **identical message either way** |
| 429 | More than 10 attempts in a minute |

> The 401 message is the same for "no such user" and "wrong password" on purpose. Do not try to tell the user which it was.

#### `GET /api/v1/auth/me`

Staff JWT required. Use it on app boot to validate a stored token and recover the role.

**200** → `ApiSuccess<{ user: StaffUserDto }>` · **401** → token invalid, expired, or the user was deactivated since issue.

---

### 5.2 Worker

All routes require the **worker capability token**.

#### `GET /api/v1/worker/me`

Returns the contract and, on first call, transitions `INVITED` → `VIEWED`.

**200** → `ApiSuccess<WorkerContractViewDto>`

```json
{
  "success": true,
  "data": {
    "contractNumber": "R&D/EOC/OC/0042/26",
    "status": "VIEWED",
    "roleTitle": "Task-Based Data Annotation Worker",
    "ratePerTaskEtb": 100,
    "agreementDate": "2026-08-21T09:14:02.101Z",
    "expiresAt": "2026-08-28T09:14:02.088Z",
    "documentUrl": "/api/v1/worker/me/document",
    "currentAttemptNumber": 0,
    "maxAttempts": 3
  },
  "requestId": "req_9f8e7d6c5b4a3021"
}
```

This DTO deliberately contains no bank details, no token hash and no internal storage paths.

#### `GET /api/v1/worker/me/document`

The agreement PDF **as uploaded by Finance** — what the worker must read before signing.

`200` · `Content-Type: application/pdf` · `Content-Disposition: inline; filename="contract.pdf"` · `Cache-Control: private, no-store`

Render with a blob URL (the `Authorization` header is required, so a plain `<iframe src>` will not work):

```ts
const res = await fetch('/api/v1/worker/me/document', {
  headers: { Authorization: `Bearer ${workerToken}` },
});
if (!res.ok) throw new Error('Could not load agreement');
const url = URL.createObjectURL(await res.blob());
```

#### `POST /api/v1/worker/me/submit`

`multipart/form-data`. Rate limited **5/min per contract**.

Requires status `VIEWED` or `RESUBMISSION_REQUIRED`.

```ts
const fd = new FormData();
fd.append('fullNameEnglish', 'Abebe Bikila Kebede');
fd.append('fullNameAmharic', 'አበበ ቢቂላ ከበደ');   // optional
fd.append('residenceLocation', 'Addis Ababa, Bole');
fd.append('bankName', 'Commercial Bank of Ethiopia');
fd.append('bankAccountNumber', '1000234567890');
fd.append('faydaFront', frontFile, 'front.jpg');
fd.append('faydaBack', backFile, 'back.jpg');

await fetch('/api/v1/worker/me/submit', {
  method: 'POST',
  headers: { Authorization: `Bearer ${workerToken}` },  // do NOT set Content-Type
  body: fd,
});
```

**200** → `ApiSuccess<WorkerSubmitResponseData>` with `message: "Contract details and Fayda ID submitted successfully for review"`

| Status | Cause | What to tell the worker |
|---|---|---|
| 400 | Field validation, missing file, image under 300×300, or bytes that don't match the declared type | The specific field / "photo is too small or unreadable" |
| 400 `INVALID_STATE_TRANSITION` | Already submitted, or attempts exhausted | "Your submission is already under review" |
| 413 | File over 10 MB | "Please use a smaller photo" |
| 415 | Declared type not an image (a PDF, for example) | "Please upload a photo, not a document" |
| 429 | More than 5 submissions a minute | Disable the button, use `Retry-After` |

> **Both files are mandatory.** Omitting one returns 400 — the multipart parser does not enforce presence, the controller does.

#### `GET /api/v1/worker/me/download`

The **sealed** agreement: 4 pages, stamped with the worker's details, signature and verification badge. Available only when `status === 'SIGNED'`.

`200` · `Content-Type: application/pdf` · `Content-Disposition: attachment; filename="Signed_Agreement_R_D_EOC_OC_0042_26.pdf"` · `X-Document-Sha256: <64-hex>`

`400 INVALID_STATE_TRANSITION` when not yet signed — gate the button on status instead of relying on the error.

---

### 5.3 Reviewer

All routes require a staff JWT with role `HR_REVIEWER` or `ADMIN`. `FINANCE` → **403**.

#### `GET /api/v1/reviewer/contracts`

| Query | Type | Default | Notes |
|---|---|---|---|
| `status` | `ContractStatus` | *(all)* | Usually `PENDING_REVIEW` |
| `page` | int ≥ 1 | `1` | |
| `limit` | int 1–100 | `20` | Server caps at 100 |

**200** → `ApiSuccess<Paginated<ContractListItemDto>>`. Sorted **oldest first**.

#### `GET /api/v1/reviewer/contracts/:id`

`:id` must be a 24-character hex ObjectId, else 400.

**⚠ This call writes a `DOSSIER_VIEWED` audit event naming the reviewer.** Fetch it when a reviewer actually opens a case — not on hover, not on prefetch, not on a poll.

**200** → `ApiSuccess<ContractDossierDto>`. Bank account numbers are decrypted here. Response is `Cache-Control: private, no-store`.

#### `GET /api/v1/reviewer/contracts/:id/id-card/:side`

`:side` is `front` or `back` (anything else → 400). Serves the **latest** attempt's image.

`200` · `Content-Type: image/jpeg` (or the real type) · `Content-Disposition: inline; filename="fayda-front"` · `Cache-Control: private, no-store`

Bytes are verified against the SHA-256 recorded at upload, so a swapped or corrupted file fails rather than being served.

#### `POST /api/v1/reviewer/contracts/:id/approve`

No body. Requires status `PENDING_REVIEW`.

Approves eKYC **and seals the PDF in one action**.

**200** → `ApiSuccess<ApproveResponseData>` with `message: "Contract verification approved successfully"`

```json
{
  "success": true,
  "message": "Contract verification approved successfully",
  "data": {
    "status": "SIGNED",
    "attemptNumber": 2,
    "documentHash": "1dd8b6a1a7cfb1398d4ed3eb2b14eedee2d45e043a5a83907567a226fbda9f2f",
    "snapshotHash": "cdade4741f22cb0a9b6419992575a333c4fe4bb8389abd9601a700bbf35bf8c8"
  },
  "requestId": "req_5c4b3a2918070605"
}
```

If sealing fails, `status` is `PDF_GENERATION_FAILED` and `sealingError` explains why. **The approval still stands** — show a "Retry sealing" action, not "Re-approve".

`400 INVALID_STATE_TRANSITION` when not `PENDING_REVIEW` (including a second approve — `SIGNED` is terminal).

#### `POST /api/v1/reviewer/contracts/:id/reject`

```json
{
  "rejectionCategory": "BLURRY_ID",
  "rejectionReasonEnglish": "The back of the ID card is out of focus; please retake it in better light.",
  "rejectionReasonAmharic": "የመታወቂያው ጀርባ ግልጽ አይደለም፤ እባክዎ በተሻለ ብርሃን ደግመው ያንሱ።"
}
```

**200** → `ApiSuccess<RejectResponseData>` with `message: "Contract verification rejected with feedback"`

The resulting `status` is decided by the server:

- `remainingAttempts > 0` → `RESUBMISSION_REQUIRED`; the worker's original link still works and they can resubmit.
- attempts exhausted → `REJECTED`, terminal.

Both reasons are sent to the worker by SMS. Only the **category** enters the audit ledger — the free-text reasons are stored on the attempt record.

#### `POST /api/v1/reviewer/contracts/:id/retry-sealing`

No body. Requires status `PDF_GENERATION_FAILED`. Re-runs sealing; bounded at 5 attempts per contract.

**200** → `ApiSuccess<{ status, documentHash?, snapshotHash?, pdfStorageKey?, error? }>`

---

### 5.4 Finance

Staff JWT (`FINANCE` / `ADMIN`) or the static API key, except where noted.

#### `POST /api/v1/finance/contracts`

`multipart/form-data`.

| Field | Required | Notes |
|---|---|---|
| `phone` | ✅ | Ethiopian mobile, any format — `0911223344`, `+251911223344`, `251911223344`. Normalised server-side |
| `contractPdf` | ✅ | The agreement PDF. Must really be a PDF; magic bytes are checked. Max 10 MB |
| `contractNumber` | ➖ | Supply the real number where you have one. Omitted → auto-allocated (`R&D/EOC/OC/0001/26`) |
| `ratePerTaskEtb` | ➖ | Default `100` |
| `expiresInHours` | ➖ | Default `168` (7 days), max `8760` |

**201** → `ApiSuccess<CreateContractResponseData>`

```json
{
  "success": true,
  "data": {
    "contractId": "6a87f8cc93203a83f321e0a3",
    "contractNumber": "R&D/EOC/OC/0042/26",
    "status": "INVITED",
    "workerAccessToken": "5afbbf3d5a17b4b15fe0940aad04779318d6af492a19709a3072628eb0d868a1",
    "inviteLink": "/sign/5afbbf3d5a17b4b15fe0940aad04779318d6af492a19709a3072628eb0d868a1",
    "expiresAt": "2026-08-28T09:14:02.088Z"
  },
  "requestId": "req_2b3c4d5e6f708192"
}
```

| Status | Cause |
|---|---|
| 400 | Bad phone, missing `contractPdf`, or a file whose bytes are not a PDF |
| 409 `CONFLICT` | `contractNumber` already exists |
| 415 | Declared type is not `application/pdf` |

#### `GET /api/v1/finance/contracts`

| Query | Type | Default |
|---|---|---|
| `status` | `ContractStatus` | **`SIGNED`** |
| `page` | int ≥ 1 | `1` |
| `limit` | int 1–100 | `20` |

**200** → `ApiSuccess<Paginated<FinanceContractListItemDto>>`. Sorted **newest first**. Bank accounts masked.

#### `GET /api/v1/finance/contracts/:id/document`

The sealed PDF. Requires `status === 'SIGNED'`, else `400`.

`200` · `Content-Type: application/pdf` · `Content-Disposition: attachment; …` · `X-Document-Sha256: <64-hex>`

#### `GET /api/v1/finance/contracts/export-payroll`

**Staff JWT only — the static API key is refused with 403.** Rate limited **3/hour per user**. Every call is audited with the row count and the operator's identity.

`200` · `Content-Type: text/csv; charset=utf-8` · `Content-Disposition: attachment; filename="payroll_export_2026-08-21.csv"` · `X-Row-Count: <n>`

Every `SIGNED` contract, one row each, with **decrypted** account numbers:

```
Contract Number,Full Name (English),Full Name (Amharic),Phone Number,Bank Name,Bank Account Number,Rate (ETB),Agreement Date,Signed Date,Document Hash
```

Three properties of the file worth knowing:

- It begins with a **UTF-8 BOM** so Excel renders Amharic correctly. If you post-process it in JS, strip `﻿` first.
- Line endings are **CRLF** (RFC 4180).
- Cells starting `=`, `+`, `-`, `@`, tab or CR are prefixed with `'` to stop spreadsheets executing them as formulas. A phone number appears as `'+251911223344`. **Strip a single leading apostrophe when parsing.**

Download it as a blob — the header is required, so a plain link will not work:

```ts
const res = await fetch('/api/v1/finance/contracts/export-payroll', {
  headers: { Authorization: `Bearer ${jwt}` },
});
if (res.status === 403) throw new Error('Payroll export requires a staff login');
if (res.status === 429) throw new Error('Export limit reached — try again later');
const url = URL.createObjectURL(await res.blob());
```

---

## 6. State machine and UI badge colours

Eleven states. Legal transitions are enforced server-side; an illegal action returns `400 INVALID_STATE_TRANSITION`.

```
DRAFT ──▶ INVITED ──▶ VIEWED ──▶ PENDING_REVIEW ──┬──▶ APPROVED ──▶ SIGNED ✦
                                                   │         └──▶ PDF_GENERATION_FAILED ──▶ (retry) APPROVED
                                                   ├──▶ RESUBMISSION_REQUIRED ──▶ PENDING_REVIEW  ⟲
                                                   └──▶ REJECTED ✦

INVITED / VIEWED ──▶ EXPIRED ✦        any non-terminal ──▶ CANCELLED ✦
                                       ✦ = terminal
```

| Status | Badge label | Colour | Tailwind | Meaning · who acts next |
|---|---|---|---|---|
| `DRAFT` | Draft | Grey | `bg-gray-100 text-gray-700` | Created, not yet invited. Internal only |
| `INVITED` | Invited | Blue | `bg-blue-100 text-blue-800` | Link sent, worker has not opened it |
| `VIEWED` | Viewed | Indigo | `bg-indigo-100 text-indigo-800` | Worker has opened it. **Awaiting their submission** |
| `PENDING_REVIEW` | Pending Review | Amber | `bg-amber-100 text-amber-800` | **HR must act.** The queue's default filter |
| `APPROVED` | Approved | Teal | `bg-teal-100 text-teal-800` | Transient — sealing in progress. Rarely seen |
| `PDF_GENERATION_FAILED` | Sealing Failed | Orange | `bg-orange-100 text-orange-800` | **Needs a retry.** Approval is intact |
| `SIGNED` | Signed | Green | `bg-green-100 text-green-800` | Complete. Download available. Payroll-eligible |
| `RESUBMISSION_REQUIRED` | Action Required | Yellow | `bg-yellow-100 text-yellow-900` | **Worker must resubmit.** Show the reason |
| `REJECTED` | Rejected | Red | `bg-red-100 text-red-800` | Terminal. Attempts exhausted or hard reject |
| `EXPIRED` | Expired | Slate | `bg-slate-200 text-slate-700` | Link lapsed before completion. Terminal |
| `CANCELLED` | Cancelled | Zinc | `bg-zinc-200 text-zinc-700` | Withdrawn administratively. Terminal |

### Which actions to enable

| Status | Worker can | HR can | Finance can |
|---|---|---|---|
| `INVITED`, `VIEWED` | View, read document, **submit** | — | — |
| `PENDING_REVIEW` | View only | **Approve / Reject** | — |
| `RESUBMISSION_REQUIRED` | View, **resubmit** | — | — |
| `PDF_GENERATION_FAILED` | View only | **Retry sealing** | — |
| `SIGNED` | View, **download** | View | **Download, export payroll** |
| `REJECTED`, `EXPIRED`, `CANCELLED` | View only | View only | View only |

```ts
const STATUS_STYLE: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT:                 { label: 'Draft',            className: 'bg-gray-100 text-gray-700' },
  INVITED:               { label: 'Invited',          className: 'bg-blue-100 text-blue-800' },
  VIEWED:                { label: 'Viewed',           className: 'bg-indigo-100 text-indigo-800' },
  PENDING_REVIEW:        { label: 'Pending Review',   className: 'bg-amber-100 text-amber-800' },
  APPROVED:              { label: 'Approved',         className: 'bg-teal-100 text-teal-800' },
  PDF_GENERATION_FAILED: { label: 'Sealing Failed',   className: 'bg-orange-100 text-orange-800' },
  SIGNED:                { label: 'Signed',           className: 'bg-green-100 text-green-800' },
  RESUBMISSION_REQUIRED: { label: 'Action Required',  className: 'bg-yellow-100 text-yellow-900' },
  REJECTED:              { label: 'Rejected',         className: 'bg-red-100 text-red-800' },
  EXPIRED:               { label: 'Expired',          className: 'bg-slate-200 text-slate-700' },
  CANCELLED:             { label: 'Cancelled',        className: 'bg-zinc-200 text-zinc-700' },
};
```

### Rejection categories — suggested labels

| Value | Label to show HR |
|---|---|
| `NAME_MISMATCH` | Name does not match the ID |
| `BLURRY_ID` | ID photo is blurry or unreadable |
| `EXPIRED_ID` | ID document has expired |
| `MISSING_BACK_IMAGE` | Back of the ID is missing or wrong |
| `INVALID_BANK_INFO` | Bank details are invalid |
| `OTHER` | Other (explain below) |

---

## 7. Seeded test credentials

Seeded automatically at startup **when `NODE_ENV` is not `production`**. Passwords are overridable via `SEED_HR_PASSWORD`, `SEED_ADMIN_PASSWORD` and `SEED_FINANCE_PASSWORD`; the defaults are below.

| Role | Email | Password | Use for |
|---|---|---|---|
| `HR_REVIEWER` | `hr-reviewer@rdgroup.et` | `Password123!` | Review dashboard |
| `FINANCE` | `finance@rdgroup.et` | `Password123!` | Finance portal, payroll export |
| `ADMIN` | `admin@rdgroup.et` | `AdminPassword123!` | Both dashboards |

There is also a non-login service account, `finance-api@service.local`, which exists only to attribute API-key actions in the audit ledger. It has no usable password.

**Worker tokens are not seeded** — create a contract through the Finance endpoint and use the `workerAccessToken` it returns.

### Getting a worker session end to end

```bash
# 1. Log in as Finance
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"finance@rdgroup.et","password":"Password123!"}' | jq -r .data.token)

# 2. Create a contract (any real PDF)
curl -s -X POST http://localhost:5000/api/v1/finance/contracts \
  -H "Authorization: Bearer $TOKEN" \
  -F 'phone=0911223344' \
  -F 'contractPdf=@./agreement.pdf;type=application/pdf' | jq

# 3. Use data.workerAccessToken as the worker bearer token
```

---

## 8. Things that will bite you

Collected from how the backend actually behaves.

1. **Never set `Content-Type` manually on a multipart request.** The browser must add the boundary. Setting it yourself produces a confusing 400.
2. **Every binary endpoint needs the `Authorization` header**, so `<img src>`, `<iframe src>` and plain download links do not work. Fetch as a blob and use `URL.createObjectURL` — and revoke it on unmount, or you leak memory.
3. **Approve returns `SIGNED`, not `APPROVED`.** Sealing happens in the same action.
4. **Opening a dossier is an audited, attributable event.** No prefetching, no polling.
5. **`workerAccessToken` is shown once.** There is no recovery endpoint.
6. **`inviteLink` is relative.** Prefix your public origin before sending it out.
7. **The payroll CSV has a BOM and formula-escaping apostrophes.** Handle both if you parse it client-side.
8. **A 401 on a worker route is indistinguishable between "unknown" and "expired".** One error screen covers both.
9. **`limit` is capped at 100** whatever you ask for. Paginate.
10. **Poll politely.** The global limit is 100 req/min per IP across *all* routes; a 5-second poll on several widgets will hit it.
11. **Dates are ISO-8601 strings**, not `Date` objects. Parse before formatting.
12. **Amharic needs a font.** Load Noto Sans Ethiopic (or similar) or Amharic names and rejection reasons render as boxes.
13. **`bankAccountNumber` in a dossier may be a message, not a number** — `(not provided)` or `(unavailable - decryption failed)`. Never parse it as digits without checking.

### A minimal API client

```ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
    readonly requestId?: string
  ) {
    super(message);
  }
}

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000';

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Only set JSON when the body is not FormData — the browser must own the
      // multipart boundary.
      ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? res.statusText,
      body?.error?.details,
      body?.requestId
    );
  }

  const body = (await res.json()) as ApiSuccess<T>;
  return body.data;
}

/** Binary endpoints (PDFs, ID images, the payroll CSV). */
export async function apiBlob(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? res.statusText
    );
  }
  return res.blob();
}
```

---

## Appendix — CORS

The server allows only the origins in `CORS_ALLOWED_ORIGINS` (default `http://localhost:3000`), methods `GET` and `POST`, and headers `Content-Type`, `Authorization`, `X-Request-Id`.

If your dev server runs on another port, that origin has to be added to the backend's `.env` — a CORS failure will otherwise look like a network error with no useful message. **There are no `PATCH`, `PUT` or `DELETE` routes**; every mutation is a `POST`.
