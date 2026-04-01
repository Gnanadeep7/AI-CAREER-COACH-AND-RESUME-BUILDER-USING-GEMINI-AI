"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { updateIndustryInsights } from "@/actions/dashboard";

const DashboardView = ({ insights }) => {
  const [currentInsights, setCurrentInsights] = useState(insights);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    salaryRanges: JSON.stringify(insights.salaryRanges, null, 2),
    growthRate: insights.growthRate,
    demandLevel: insights.demandLevel,
    marketOutlook: insights.marketOutlook,
    topSkills: insights.topSkills.join(", "),
    keyTrends: insights.keyTrends.join(", "),
    recommendedSkills: insights.recommendedSkills.join(", "),
    nextUpdate: insights.nextUpdate
      ? new Date(insights.nextUpdate).toISOString()
      : "",
  });

  const { loading, data: updated, fn: updateInsights } =
    useFetch(updateIndustryInsights);

  useEffect(() => {
    if (!updated) return;
    setCurrentInsights(updated);
    setOpen(false);
    toast.success("Industry insights updated");
    setForm({
      salaryRanges: JSON.stringify(updated.salaryRanges, null, 2),
      growthRate: updated.growthRate,
      demandLevel: updated.demandLevel,
      marketOutlook: updated.marketOutlook,
      topSkills: updated.topSkills.join(", "),
      keyTrends: updated.keyTrends.join(", "),
      recommendedSkills: updated.recommendedSkills.join(", "),
      nextUpdate: updated.nextUpdate
        ? new Date(updated.nextUpdate).toISOString()
        : "",
    });
  }, [updated]);

  // Transform salary data for the chart
  const salaryData = useMemo(
    () =>
      currentInsights.salaryRanges.map((range) => ({
        name: range.role,
        min: range.min / 1000,
        max: range.max / 1000,
        median: range.median / 1000,
      })),
    [currentInsights.salaryRanges]
  );

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(currentInsights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(currentInsights.marketOutlook).color;

  // Format dates using date-fns
  const lastUpdatedDate = format(
    new Date(currentInsights.lastUpdated),
    "dd/MM/yyyy"
  );
  const nextUpdateDistance = formatDistanceToNow(
    new Date(currentInsights.nextUpdate),
    { addSuffix: true }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Last updated: {lastUpdatedDate}</Badge>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Edit insights
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Industry Insights</DialogTitle>
              <DialogDescription>
                Update the data shown on your dashboard. Lists accept
                comma-separated values. Salary ranges expect JSON.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Salary ranges (JSON)</label>
                <Textarea
                  value={form.salaryRanges}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, salaryRanges: e.target.value }))
                  }
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Growth rate (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.growthRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, growthRate: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Demand level</label>
                  <Select
                    value={form.demandLevel}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, demandLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select demand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Market outlook</label>
                  <Select
                    value={form.marketOutlook}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, marketOutlook: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outlook" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Positive">Positive</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                      <SelectItem value="Negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Next update date</label>
                  <Input
                    type="date"
                    value={form.nextUpdate ? form.nextUpdate.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nextUpdate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Top skills</label>
                  <Input
                    value={form.topSkills}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, topSkills: e.target.value }))
                    }
                    placeholder="React, Node, SQL"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Recommended skills</label>
                  <Input
                    value={form.recommendedSkills}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        recommendedSkills: e.target.value,
                      }))
                    }
                    placeholder="AI/ML, Cloud"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Key trends</label>
                  <Textarea
                    value={form.keyTrends}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, keyTrends: e.target.value }))
                    }
                    placeholder="Remote work, Edge computing"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateInsights(form)}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Outlook
            </CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentInsights.marketOutlook}
            </div>
            <p className="text-xs text-muted-foreground">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Industry Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentInsights.growthRate.toFixed(1)}%
            </div>
            <Progress value={currentInsights.growthRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentInsights.demandLevel}
            </div>
            <div
              className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                currentInsights.demandLevel
              )}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {currentInsights.topSkills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Ranges Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
          <CardDescription>
            Displaying minimum, median, and maximum salaries (in thousands)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          {payload.map((item) => (
                            <p key={item.name} className="text-sm">
                              {item.name}: ${item.value}K
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>
              Current trends shaping the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {insights.keyTrends.map((trend, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentInsights.recommendedSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
