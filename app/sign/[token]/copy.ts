export const SIGN_COPY = {
  // Form sections and field labels
  yourDetails: "Personal information",
  fullNameEnglish: "Full name (English)",
  fullNameAmharic: "Full name (Amharic)",
  residence: "Residential address",
  residenceHint: "City, sub-city, woreda",
  paymentDetails: "Payout & bank details",
  bankName: "Bank name",
  accountHolder: "Account holder name",
  accountNumber: "Bank account number",
  faydaId: "Fayda National ID photos",
  idFront: "Front of ID",
  idBack: "Back of ID",

  // Legal declaration & signature
  declaration: "Legal declaration & signature",
  consent:
    "I declare that the information and Fayda ID I have submitted are true, accurate, and belong to me.",
  signaturePreview: "Generated electronic signature",
  submit: "Review & submit agreement",
  signingAs: "Signing as",
  notSignedYet: "Enter your full name to sign",
  submitNote: "Our team reviews your submission before the agreement is final.",

  // Document
  documentPreview: "Agreement document",
  tapToRead: "Tap to read the agreement",

  // Status screens
  underReview: "Your submission is under review",
  verifiedSigned: "Verified & Signed",
  linkExpired: "This signing link has expired",
  contractCancelled: "This contract was cancelled",
  notApproved: "This contract was not approved",
  approvedPreparingCopy: "Your agreement is approved",

  // Remediation
  actionRequired: "Action required",
  readAgreement: "Read the agreement carefully before signing",
} as const;

export const SIGN_ROADMAP_COPY = {
  welcome: "Thank you for applying. Please read the agreement below carefully before you sign.",
  heading: "What happens next",
  steps: [
    { title: "Review", desc: "Read all 4 pages of the agreement." },
    {
      title: "Sign and submit",
      desc: "Sign the agreement, then click Review & submit agreement.",
    },
    { title: "We review", desc: "Our team checks your signed agreement." },
    { title: "Get your copy", desc: "We send the signed agreement back to you." },
    {
      title: "Wait for training",
      desc: "We will contact you about in-person training. It covers the EDGE program, the platform you will use, the partners involved and your tasks.",
    },
  ],
  reassurance: "After step 4 you don't need to do anything. Please wait until we contact you.",
  learnMore: "To learn more, please visit:",
  questionsHeader: "If you have any questions, please contact us only through:",
  closing: "We look forward to working with you.",
} as const;
