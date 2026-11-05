import { z } from "zod";
import {
  ETHIOPIAN_REGIONS,
  GENDER_OPTIONS,
  MAX_APPLICANT_AGE,
  MIN_APPLICANT_AGE,
  VULNERABILITY_OPTIONS,
} from "@/lib/ethiopia";
import type { CandidateGender, VulnerabilityStatus } from "@/types/backend";

const LATIN_NAME_PATTERN = /^[a-zA-Z\s.'-]+$/;

const GENDER_VALUES = GENDER_OPTIONS.map((option) => option.value) as [
  CandidateGender,
  ...CandidateGender[],
];

const VULNERABILITY_VALUES = VULNERABILITY_OPTIONS.map((option) => option.value) as [
  VulnerabilityStatus,
  ...VulnerabilityStatus[],
];

export const AGE_RANGE_MESSAGE = `Applicants must be between ${MIN_APPLICANT_AGE} and ${MAX_APPLICANT_AGE} years old`;
export const AGE_INTEGER_MESSAGE = "Age must be a whole number";

function namePart(label: string) {
  return z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} is too long`)
    .regex(LATIN_NAME_PATTERN, `${label} must use Latin letters only`);
}

export const candidateApplySchema = z.object({
  firstName: namePart("First name"),
  fatherName: namePart("Father's name"),
  grandfatherName: namePart("Grandfather's name"),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your mobile number")
    .regex(
      /^(\+251|251|0)?(9|7)\d{8}$/,
      "Enter a valid Ethiopian mobile number, for example 0911234567"
    ),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).optional(),
  gender: z.enum(GENDER_VALUES, { error: "Please select your gender" }),
  age: z
    .number({ error: "Please enter your age" })
    .int(AGE_INTEGER_MESSAGE)
    .min(MIN_APPLICANT_AGE, AGE_RANGE_MESSAGE)
    .max(MAX_APPLICANT_AGE, AGE_RANGE_MESSAGE),
  region: z.enum(ETHIOPIAN_REGIONS, { error: "Please select your region" }),
  vulnerabilityStatus: z.enum(VULNERABILITY_VALUES, { error: "Please select an option" }),
  willingToAttendTraining: z.enum(["yes", "no"], { error: "Please answer this question" }),
  website_hp: z.string().optional(),
});

export type CandidateApplyInput = z.infer<typeof candidateApplySchema>;
