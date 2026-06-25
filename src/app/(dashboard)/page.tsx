import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getCases } from "@/features/cases/actions";
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge";
import { getDashboardMetrics, getRecentActivity } from "@/features/dashboard/actions";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { Database } from "@/types/database";

type CaseStatus = Database["public"]["Enums"]["case_status"];

interface HighPriorityCaseItem {
  id: string;
  applicantName: string;
  status: CaseStatus;
}

export default async function Dashboard() {
  let dbCases: any[] = [];
  try {
    dbCases = await getCases();
  } catch (error) {
    console.error("Failed to load cases:", error);
  }

  const metrics = await getDashboardMetrics();
  const recentActivities = await getRecentActivity();

  // Filter cases in Uploaded or NeedsReview
  const realHighPriority = dbCases.filter(
    (c) => c.status === "Uploaded" || c.status === "NeedsReview" || c.status === "DraftGenerated"
  ).slice(0, 5);

  const displayHighPriority: HighPriorityCaseItem[] = realHighPriority.length > 0
    ? realHighPriority.map((c) => ({
        id: c.id,
        applicantName: `${c.applicants?.[0]?.first_name || "Unknown"} ${c.applicants?.[0]?.last_name || "Applicant"}`,
        status: c.status,
      }))
    : [];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Dashboard</h1>
          <p className="text-body text-text-secondary mt-xs">
            Overview of active visa verification cases and system status.
          </p>
        </div>
        <div className="text-small font-medium text-text-secondary bg-surface border border-text-secondary/10 px-md py-sm rounded-button self-start sm:self-auto">
          {currentDate}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-2xl">
        <Card className="p-lg flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="text-body font-medium text-text-secondary">Active Cases</p>
            <h3 className="text-title font-semibold text-text-primary">{metrics.activeCasesCount}</h3>
          </div>
          <div className="p-md bg-accent/10 text-accent rounded-button">
            <FileText className="w-xl h-xl" />
          </div>
        </Card>

        <Card className="p-lg flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="text-body font-medium text-text-secondary">Pending Review</p>
            <h3 className="text-title font-semibold text-text-primary">{metrics.pendingReviewCount}</h3>
          </div>
          <div className="p-md bg-warning/10 text-warning rounded-button">
            <AlertCircle className="w-xl h-xl" />
          </div>
        </Card>

        <Card className="p-lg flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="text-body font-medium text-text-secondary">Resolved Today</p>
            <h3 className="text-title font-semibold text-text-primary">{metrics.resolvedTodayCount}</h3>
          </div>
          <div className="p-md bg-success/10 text-success rounded-button">
            <CheckCircle2 className="w-xl h-xl" />
          </div>
        </Card>

        <Card className="p-lg flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="text-body font-medium text-text-secondary">Avg. Processing Time</p>
            <h3 className="text-title font-semibold text-text-primary">{metrics.avgProcessingTimeMinutes}m</h3>
          </div>
          <div className="p-md bg-accent/10 text-accent rounded-button">
            <Clock className="w-xl h-xl" />
          </div>
        </Card>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Left Column: High-Priority Cases */}
        <Card className="p-xl flex flex-col min-h-[400px]">
          <div className="mb-lg flex items-center justify-between">
            <h2 className="text-heading font-semibold text-text-primary">High-Priority Cases</h2>
            <Link href="/cases" className="text-small font-medium text-accent hover:underline">
              View all cases
            </Link>
          </div>
          <div className="flex flex-col gap-md">
            {displayHighPriority.length > 0 ? (
              displayHighPriority.map((c) => (
                <Link key={c.id} href={`/cases/${c.id}`}>
                  <div className="flex items-center justify-between p-md border border-text-secondary/10 rounded-button hover:bg-background transition-colors">
                    <div>
                      <p className="text-body font-medium text-text-primary">{c.applicantName}</p>
                      <p className="text-small text-text-secondary mt-xs">Case ID: {c.id.slice(0, 8)}...</p>
                    </div>
                    <CaseStatusBadge status={c.status} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-text-secondary mt-xl">No active high-priority cases.</div>
            )}
          </div>
        </Card>

        {/* Right Column: Recent Activity */}
        <Card className="p-xl flex flex-col min-h-[400px]">
          <h2 className="text-heading font-semibold text-text-primary mb-lg">Recent Activity</h2>
          <div className="flex flex-col gap-xl">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex gap-md">
                  <div className="flex flex-col items-center">
                    <div className="w-sm h-sm rounded-full bg-accent" />
                    <div className="flex-1 w-px bg-text-secondary/10 mt-xs" />
                  </div>
                  <div className="pb-sm">
                    <p className="text-body font-medium text-text-primary">
                      {act.user} <span className="text-text-secondary font-normal">— {act.action}</span>
                    </p>
                    <p className="text-small text-text-secondary mt-xs">{act.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-text-secondary mt-xl">No recent activity found.</div>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

