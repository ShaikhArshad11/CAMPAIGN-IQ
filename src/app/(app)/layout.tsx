"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignProvider } from "@/contexts/CampaignContext";
import AppLayout from "@/components/AppLayout";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [router, user, loading]);

  if (loading) return null;
  if (!user) return null;

  return (
    <CampaignProvider>
      <AppLayout>{children}</AppLayout>
    </CampaignProvider>
  );
}
