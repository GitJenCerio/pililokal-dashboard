"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { LeadsDataResult } from "@/lib/leads-db";

const COLORS = ["#8B4513", "#D4A574", "#5D4E37", "#A0826D", "#3E2723", "#6D4C41"];

export function AnalyticsClient({
  pipelineByStage,
  categoryBreakdown,
  countryData,
  encodedByData,
  leadsData,
}: {
  pipelineByStage: { name: string; value: number }[];
  categoryBreakdown: { name: string; leads: number; merchants: number }[];
  countryData: { name: string; value: number }[];
  encodedByData: { name: string; value: number }[];
  leadsData: LeadsDataResult;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Leads grouped by stage / source sheet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineByStage} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Country Split</CardTitle>
            <CardDescription>PH vs US leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {countryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-muted-foreground">
                  No country data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Leads and merchants by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" name="Leads" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="merchants" name="Merchants" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-muted-foreground">
                  No category data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Staff Workload (encodedBy)</CardTitle>
            <CardDescription>Leads assigned per encoder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {encodedByData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={encodedByData} margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-muted-foreground">
                  No encodedBy data
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary KPIs</CardTitle>
          <CardDescription>Lead pipeline overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{leadsData.kpis.total}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">PH Confirmed</p>
              <p className="text-2xl font-bold">{leadsData.kpis.phConfirmed}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">US Confirmed</p>
              <p className="text-2xl font-bold">{leadsData.kpis.usConfirmed}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Needs Followup</p>
              <p className="text-2xl font-bold">
                {leadsData.allRows.filter((r) => r.needsFollowup).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
