export const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Dire Dawa",
  "Oromia",
  "Amhara",
  "Tigray",
  "Sidama",
  "Somali",
  "Benishangul-Gumuz",
  "Gambella",
  "Harari",
  "Afar",
  "South Ethiopia",
  "Central Ethiopia",
  "South West Ethiopia",
] as const;

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

export const VULNERABILITY_OPTIONS = [
  { value: "NONE", label: "None of the above" },
  { value: "PWD", label: "Person with Disability" },
  { value: "REFUGEE", label: "Refugee" },
  { value: "IDP", label: "Internally Displaced Person" },
  { value: "RETURNEE", label: "Returnee" },
] as const;

export const TRAINING_OPTIONS = [
  { value: "yes", label: "Yes, I am willing" },
  { value: "no", label: "No" },
] as const;

export const MIN_APPLICANT_AGE = 18;
export const MAX_APPLICANT_AGE = 35;
