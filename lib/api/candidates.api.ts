import { api } from "./client";
import type {
  PublicCandidateApplyDto,
  PublicCandidateApplyResponseData,
} from "@/types/backend";

export const candidatesApi = {
  apply: (dto: PublicCandidateApplyDto) =>
    api<PublicCandidateApplyResponseData>("/public/candidates/apply", {
      method: "POST",
      body: dto,
    }),
};
