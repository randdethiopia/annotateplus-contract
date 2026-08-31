export const CONTRACT_VERSION = "v1.0";

// Header/footer chrome that repeats on every page of the source PDF
// (Y2Q2 TASK-BASED DATA ANNOTATION WORKER AGREEMENT_V2.pdf).
export const DOC_CODE = "R&D EOC/HR/007";
export const DOC_HEADER_TITLE = "Agreement";
export const DOC_REVISION = "Rev no-1";
export const DOC_TAGLINE = "INNOVATE YOUR BUSINESS";

export const AGREEMENT_TITLE = "TASK-BASED DATA ANNOTATION WORKER AGREEMENT";
/** Page count of the source PDF. Read by the signing portal's viewer header. */
export const AGREEMENT_PAGE_COUNT = 4;
export const AGREEMENT_DESCRIPTION =
  "This Agreement sets out the terms under which you will complete task-based data annotation work for R&D, including scope of work, payment, confidentiality, and quality expectations. Please read it in full before signing.";
export const COMPANY_NAME = "R & D Entrepreneurship and Outsourcing Center PLC";
export const COMPANY_SHORT = "R&D Group";
export const COMPANY_ADDRESS = "Addis Ababa, Lideta";
export const COMPANY_SIGNATORY_NAME = "Brook Debela";
export const COMPANY_SIGNATORY_TITLE = "Innovation Team Manager";

export type Bullet = string | { text: string; subBullets: string[] };

export interface ContractSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: Bullet[];
  table?: { headers: string[]; rows: string[][] };
}

// Transcribed verbatim from the source PDF, including its own wording —
// only whitespace/line-wrap artifacts from PDF extraction were cleaned up.
export const CONTRACT_SECTIONS: ContractSection[] = [
  {
    id: "purpose",
    title: "1. Purpose",
    paragraphs: [
      `This Agreement sets forth the terms and conditions under which the Data annotation Worker shall provide data annotation services through the Platform, on a task-by-task basis. This Agreement creates no employer–employee relationship, partnership, or joint venture, and neither a passing outcome nor continued engagement is guaranteed.`,
      `The Data Annotation Worker acknowledges that the engagement is non-exclusive and task-dependent, and that there is no guarantee of continuous work assignment from the Company.`,
    ],
  },
  {
    id: "scope",
    title: "2. Scope of Work",
    bullets: [
      "The Data annotation Worker shall complete the required program components, virtual webinar attendance, account creation, task creation, and task extraction, as instructed by the Company.",
      "Each component includes clear instructions and expected deliverables as defined by the program team.",
      "Instructions and requirements are shared by the Supervisor, Team Lead, or official program communications, with sufficient clarity for proper execution.",
      "If any requirement is unclear or ambiguous, the Data annotation Worker shall contact the Supervisor via the official recruitment email or designated communication channel for clarification.",
    ],
  },
  {
    id: "nature",
    title: "3. Nature of Engagement",
    bullets: [
      "The Data annotation Worker is engaged as an independent contractor for the purposes of this program.",
      "This Agreement does not create an employer–employee relationship, partnership, or joint venture.",
      "The Data annotation Worker is not obligated to complete the program if unavailable, and the Company is not obliged to guarantee a passing evaluation outcome or continued engagement.",
    ],
  },
  {
    id: "assignment",
    title: "4. Task Assignment and Delivery",
    bullets: [
      "Tasks will be assigned based on work availability and the Data annotation Worker's performance.",
      "Each task must be completed following the instructions, quality standards, and time requirements provided.",
    ],
  },
  {
    id: "payment",
    title: "5. Payment Terms",
    bullets: [
      "The payment for each completed and approved task is 100 ETB (Hundred Ethiopian Birr). This rate applies uniformly to both image tasks and video tasks.",
      "Data annotation Workers who pass evaluation receive this Agreement to review, complete, and sign, and must submit via the official recruitment email their bank account number, national ID, and a signed copy of this Agreement.",
      "The Company verifies the national ID and account number before releasing payment; no payment is processed if verification is incomplete.",
      "The company shall deduct or withhold the appropriate federal income taxes, and other statutory deductions from the compensation stated above and affect payments to Ethiopian revenue and customs Authority.",
    ],
  },
  {
    id: "quality",
    title: "6. Quality Assurance",
    paragraphs: [
      "All submissions undergo evaluation against the rubric below; the resulting outcome level feeds directly into the payment tier in Section 5.1.",
    ],
    table: {
      headers: ["Task", "Evaluation Criteria", "Task-Equivalent", "Outcome Weight"],
      rows: [
        [
          "Virtual webinar attendance",
          "Attend the webinar by logging in with their registered email.",
          "7.5",
          "25%",
        ],
        [
          "Account creation",
          "Screenshot shows account email (profile) matching the submission email, with the account dashboard visible.",
          "6",
          "20%",
        ],
        [
          "Task creation",
          "Screenshot shows the task name, date, and creator account clearly visible.",
          "6",
          "20%",
        ],
        [
          "Task extraction",
          "Screenshot shows the completed task export screen and matches the provided Task ID.",
          "6",
          "20%",
        ],
        [
          "Certificate",
          "Certificate shows the Data annotation Worker's full name and course title, issued within the program window.",
          "4.5",
          "15%",
        ],
      ],
    },
    bullets: [
      "Components not meeting the stated criteria may be marked incomplete or failing and compensated only per the pro-rated formula in Section 5.1, or rejected.",
      "Falsified screenshots, certificates, or verification documents may result in disqualification or termination of this Agreement (see Section 12).",
    ],
  },
  {
    id: "tools",
    title: "7. Tools and Access",
    bullets: [
      "The Data annotation Worker will access the platform using credentials provided by the Company.",
      "Any images, videos, or datasets accessed are confidential and may only be used for assigned annotation purposes.",
      "Unauthorized downloading, sharing, or reproduction of content is strictly prohibited.",
    ],
  },
  {
    id: "confidentiality",
    title: "8. Confidentiality",
    bullets: [
      "The Data annotation Worker shall treat all data, media, and project-related information as strictly confidential.",
      "The Data annotation Worker agrees not to disclose, reproduce, or share any information obtained through the platform with any third party.",
      "This obligation continues even after the termination of this Agreement.",
    ],
  },
  {
    id: "ip",
    title: "9. Intellectual Property",
    bullets: [
      "All work products, annotations, and data generated under this Agreement are the exclusive property of the Company.",
      "The Data annotation Worker waives any claim to ownership or reuse of the annotated materials.",
    ],
  },
  {
    id: "communication",
    title: "10. Communication",
    bullets: [
      "All work-related communication shall take place through official Telegram channels or groups managed by the supervisory team.",
      "The Data annotation Worker shall always maintain professional and respectful communication.",
    ],
  },
  {
    id: "safeguarding",
    title: "11. Safeguarding Policy",
    bullets: [
      "Both Parties agree to adhere to the Company's Safeguarding Policy, which aims to protect all individuals, data subjects, and digital assets from harm, misuse, exploitation, or unethical handling.",
      {
        text: "The Data annotation Worker commits to:",
        subBullets: [
          "Handle all data responsibly and ethically.",
          "Avoid exposure, sharing, or use of sensitive or inappropriate content outside the work platform.",
          "Report immediately to the Supervisor or Team Lead if any harmful, illegal, or sensitive content is encountered.",
          "Refrain from using any data for personal, financial, or external purposes.",
        ],
      },
      "The Company shall ensure a safe, respectful, and non-discriminatory environment for all Data annotation workers, protecting them from exploitation, harassment, or unfair treatment.",
      "Breach of this policy may lead to immediate termination of the Agreement and potential legal action.",
    ],
  },
  {
    id: "termination",
    title: "12. Termination",
    bullets: [
      "Either Party may terminate this Agreement at any time. The data annotation worker should notify the employer about the termination in advance before accepting any task, any task accepted by the data annotation worker should be submitted correctly before re",
      "Upon termination, the Data annotation Worker shall be compensated for all approved and verified tasks completed up to the termination date.",
      "Upon termination, the Data annotation Worker's platform access will be revoked.",
    ],
  },
  {
    id: "liability",
    title: "13. Liability",
    bullets: [
      "The Data annotation Worker is responsible for ensuring that all submitted work is accurate and performed with due diligence.",
      "The Company shall not be liable for any indirect, incidental, or consequential losses arising from this engagement.",
    ],
  },
  {
    id: "governing-law",
    title: "14. Governing Law",
    paragraphs: [
      "This Agreement shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia.",
    ],
  },
  {
    id: "entire-agreement",
    title: "15. Entire Agreement",
    paragraphs: [
      "This Agreement represents the entire understanding between the Parties and supersedes all prior discussions or written communications related to the subject matter.",
    ],
  },
];
