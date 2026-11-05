"use client";

import { useQuery } from "@tanstack/react-query";
import { candidatesApi, type CandidateListParams } from "@/lib/api/candidates.api";

export function useCandidates(token: string | null, filters?: CandidateListParams) {
  return useQuery({
    queryKey: ["candidates", token, filters],
    queryFn: () => candidatesApi.list(token!, filters),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}
