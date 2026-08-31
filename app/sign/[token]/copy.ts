/**
 * Bilingual copy for the candidate signing portal.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NEEDS NATIVE REVIEW. The Amharic strings below were authored for layout and
 * comprehension, not certified by a native speaker. Have someone on the Ethiopia
 * team read this file before release. Everything user-facing in Ge'ez script on
 * this surface lives here, so it can be corrected — or dropped — in one place.
 *
 * Rejection reasons are NOT here: those are written by HR per candidate and come
 * back from the API already bilingual.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SIGN_COPY = {
  // Form sections and field labels
  yourDetails: { en: "Personal information", am: "የእርስዎ መረጃ" },
  fullNameEnglish: { en: "Full name (English)", am: "ሙሉ ስም በእንግሊዝኛ" },
  fullNameAmharic: { en: "Full name (Amharic)", am: "ሙሉ ስም በአማርኛ" },
  residence: { en: "Residential address", am: "የመኖሪያ አድራሻ" },
  residenceHint: {
    en: "City, sub-city, woreda",
    am: "ከተማ፣ ክፍለ ከተማ፣ ወረዳ",
  },
  paymentDetails: { en: "Payout & bank details", am: "የክፍያ መረጃ" },
  bankName: { en: "Bank name", am: "የባንክ ስም" },
  bankNameOther: { en: "Your bank's name", am: "የባንክዎ ስም" },
  accountHolder: { en: "Account holder name", am: "የሂሳብ ባለቤት ስም" },
  accountNumber: { en: "Bank account number", am: "የባንክ ሂሳብ ቁጥር" },
  faydaId: { en: "Fayda National ID photos", am: "የፋይዳ መታወቂያ ፎቶዎች" },
  idFront: { en: "Front of ID", am: "የመታወቂያው ፊት" },
  idBack: { en: "Back of ID", am: "የመታወቂያው ጀርባ" },

  // Legal declaration & signature
  declaration: { en: "Legal declaration & signature", am: "የሕግ ማረጋገጫና ፊርማ" },
  consent: {
    en: "I declare that the information and Fayda ID I have submitted are true, accurate, and belong to me.",
    am: "ያስገባሁት መረጃና የፋይዳ መታወቂያ ትክክለኛና የእኔ መሆኑን አረጋግጣለሁ።",
  },
  signaturePreview: {
    en: "Generated electronic signature",
    am: "የተፈጠረ ኤሌክትሮኒክ ፊርማ",
  },
  submit: { en: "Review & submit agreement", am: "ውሉን አረጋግጠው ያስገቡ" },

  // Document
  documentPreview: { en: "Agreement document", am: "የውል ሰነድ" },
  tapToRead: { en: "Tap to read the agreement", am: "ውሉን ለማንበብ ይንኩ" },

  // Status screens
  underReview: {
    en: "Your submission is under review",
    am: "ማመልከቻዎ በምርመራ ላይ ነው",
  },
  verifiedSigned: { en: "Verified & Signed", am: "ተረጋግጦ ተፈርሟል" },
  linkExpired: { en: "This signing link has expired", am: "የመፈረሚያ ጊዜው አልፏል" },
  contractCancelled: { en: "This contract was cancelled", am: "ይህ ውል ተሰርዟል" },
  notApproved: { en: "This contract was not approved", am: "ውሉ አልጸደቀም" },

  // Remediation
  actionRequired: { en: "Action required", am: "እርምጃ ያስፈልጋል" },
  readAgreement: {
    en: "Read the agreement carefully before signing",
    am: "ከመፈረምዎ በፊት ውሉን በጥንቃቄ ያንብቡ",
  },
} as const;
