import type { Metadata } from "next";
import { ActivateAccountClient } from "./activate-account-client";

export const metadata: Metadata = {
  title: "Activate Account | R&D Group AnnotatePlus Contract",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ActivateAccountPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ActivateAccountClient token={token} />;
}
