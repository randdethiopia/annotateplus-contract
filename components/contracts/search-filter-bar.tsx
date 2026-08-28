"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_STYLE } from "@/components/agar/status-badge";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { ContractStatus } from "@/types/backend";

export function SearchFilterBar({
  search,
  onSearchChange,
  onSearchCommit,
  status,
  onStatusChange,
  statusOptions,
  searchPlaceholder = "Search name, phone, or contract number…",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  status: ContractStatus | "ALL";
  onStatusChange: (value: ContractStatus | "ALL") => void;
  statusOptions: (ContractStatus | "ALL")[];
  searchPlaceholder?: string;
}) {
  const [inputValue, setInputValue] = useState(search);
  const debouncedInput = useDebouncedValue(inputValue, 300);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  useEffect(() => {
    if (debouncedInput !== search) {
      onSearchChange(debouncedInput);
      onSearchCommit?.();
    }
  }, [debouncedInput, search, onSearchChange, onSearchCommit]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
