"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_STYLE } from "@/components/contracts/status-badge";
import type { ContractStatus } from "@/types/backend";

export function SearchFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  searchPlaceholder = "Search this page…",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: ContractStatus | "ALL";
  onStatusChange: (value: ContractStatus | "ALL") => void;
  statusOptions: (ContractStatus | "ALL")[];
  searchPlaceholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={(v) => onStatusChange(v as ContractStatus | "ALL")}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option === "ALL" ? "All statuses" : STATUS_STYLE[option].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
