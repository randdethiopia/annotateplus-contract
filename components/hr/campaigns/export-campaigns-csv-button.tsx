"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CAMPAIGN_STATUS_STYLE } from "@/components/hr/campaigns/campaign-status";
import { campaignsApi } from "@/lib/api/campaigns.api";
import { downloadCsv } from "@/lib/csv";
import { describeError } from "@/lib/describe-error";
import type { CampaignListItemDto, CampaignQueryFilters } from "@/types/backend";

const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_PAGES = 10;

function rowFor(item: CampaignListItemDto): Record<string, string> {
  return {
    "Campaign Number": item.campaignNumber,
    Title: item.title,
    "Project Code": item.projectCode,
    Status: CAMPAIGN_STATUS_STYLE[item.status].label,
    Workers: String(item.totalWorkers),
    "Total Budget (ETB)": String(item.totalAmount),
    "Created At": item.createdAt,
  };
}

export function ExportCampaignsCsvButton({
  token,
  filters,
  total,
  className,
}: {
  token: string;
  filters: CampaignQueryFilters;
  total: number;
  className?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const rows: CampaignListItemDto[] = [];
      let page = 1;
      let totalPages = 1;
      let truncated = false;

      do {
        const result = await campaignsApi.getCampaigns(token, {
          ...filters,
          page,
          limit: EXPORT_PAGE_SIZE,
        });
        rows.push(...result.data);
        truncated = result.pagination.totalPages > MAX_EXPORT_PAGES;
        totalPages = Math.min(result.pagination.totalPages, MAX_EXPORT_PAGES);
        page += 1;
      } while (page <= totalPages);

      if (rows.length === 0) {
        toast.error("Nothing to export for these filters.");
        return;
      }

      downloadCsv("campaigns.csv", rows.map(rowFor));

      if (truncated) {
        toast.warning(
          `Exported the first ${rows.length.toLocaleString()} rows. Narrow the filters to export the rest.`
        );
      } else {
        toast.success(`Exported ${rows.length.toLocaleString()} campaigns`);
      }
    } catch (err) {
      console.error("Campaign CSV export failed", err);
      toast.error(describeError(err, "Export failed"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={total === 0 || isExporting || !token}
      onClick={handleExport}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {isExporting ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
