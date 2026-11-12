import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/auth/require-permission";

export default async function CampaignDeskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RequirePermission permission="campaigns:create" homeHref="/hr" inset>
      <div className="space-y-6">
        <PageHeader
          category="HR / Workforce"
          title="Campaign Desk"
          description="Workers, task tiers, and the manager approval trail for this campaign."
        />
        <EmptyState
          icon={<Hammer className="size-5" />}
          title="This desk is not built yet."
          description={`Campaign ${id} will open here once the detail view ships.`}
          action={
            <Button asChild variant="outline">
              <Link href="/hr/campaigns">
                <ArrowLeft className="size-4" aria-hidden />
                Back to Campaigns
              </Link>
            </Button>
          }
        />
      </div>
    </RequirePermission>
  );
}
