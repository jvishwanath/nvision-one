"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/top-bar";
import {
  CheckSquare,
  StickyNote,
  TrendingUp,
  Plane,
  Plus,
  MapPin,
  CloudSun,
  CircleAlert,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { taskRepository } from "@/features/tasks/repository";
import { noteRepository } from "@/features/notes/repository";
import { watchlistRepository } from "@/features/finance/repository";
import { travelRepository } from "@/features/travel/repository";
import type { Task } from "@/features/tasks/types";
import { formatDate } from "@/lib/utils";

function weatherCodeToLabel(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather";
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67].includes(code)) return "🌧️";
  if ([71, 73, 75, 77].includes(code)) return "❄️";
  if ([80, 81, 82].includes(code)) return "🌧️";
  if ([85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  totalNotes: number;
  recentNoteTitle: string;
  totalWatching: number;
  totalTrips: number;
  nextTripName: string;
  nextTripDays: number | null;
  nextTripDestination: string;
}

function ProgressRing({ percent, size = 52, strokeWidth = 5 }: { percent: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    pendingTasks: 0,
    totalNotes: 0,
    recentNoteTitle: "",
    totalWatching: 0,
    totalTrips: 0,
    nextTripName: "",
    nextTripDays: null,
    nextTripDestination: "",
  });
  const [mounted, setMounted] = useState(false);
  const [reminders, setReminders] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [weatherLabel, setWeatherLabel] = useState<string | null>(null);
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    async function loadStats() {
      const [allTasks, allNotes, totalWatching, allTrips] = await Promise.all([
        taskRepository.getAll(),
        noteRepository.getAll(),
        watchlistRepository.count(),
        travelRepository.getAllTrips(),
      ]);
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.completed).length;
      const totalNotes = allNotes.length;
      const totalTrips = allTrips.length;

      const now = Date.now();
      const todayStr = new Date().toISOString().slice(0, 10);

      const overdueTasks = allTasks.filter((t) => {
        if (t.completed || !t.dueDate) return false;
        return t.dueDate < todayStr;
      }).length;

      const pendingTasks = allTasks.filter((t) => !t.completed).length;

      const sorted = [...allNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const recentNoteTitle = sorted[0]?.title ?? "";

      const upcomingTrips = allTrips
        .filter((t) => t.startDate >= todayStr)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      const nextTrip = upcomingTrips[0];
      let nextTripName = "";
      let nextTripDays: number | null = null;
      let nextTripDestination = "";
      if (nextTrip) {
        nextTripName = nextTrip.name;
        nextTripDestination = nextTrip.destination;
        const msUntil = new Date(nextTrip.startDate).getTime() - now;
        nextTripDays = Math.max(0, Math.ceil(msUntil / (24 * 60 * 60 * 1000)));
      }

      const tenDaysFromNow = now + 10 * 24 * 60 * 60 * 1000;
      const upcoming = allTasks
        .filter((task) => {
          if (task.completed || !task.dueDate) return false;
          const dueAt = new Date(task.dueDate).getTime();
          return Number.isFinite(dueAt) && dueAt <= tenDaysFromNow;
        })
        .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
        .slice(0, 5);

      setStats({ totalTasks, completedTasks, overdueTasks, pendingTasks, totalNotes, recentNoteTitle, totalWatching, totalTrips, nextTripName, nextTripDays, nextTripDestination });
      setReminders(upcoming);
      setAllTasks(allTasks);
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function fetchLocationAndWeather() {
      try {
        const geoRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!geoRes.ok) return;
        const geo = (await geoRes.json()) as {
          city?: string;
          region?: string;
          country?: string;
          latitude?: string;
          longitude?: string;
        };

        const city = geo.city;
        const region = geo.region ?? geo.country ?? "";
        if (city) {
          setLocationLabel(`${city}, ${region}`.replace(/,\s*$/, ""));
        } else if (region) {
          setLocationLabel(region);
        }

        const lat = parseFloat(geo.latitude ?? "");
        const lon = parseFloat(geo.longitude ?? "");
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
        );
        if (!weatherRes.ok) return;
        const weatherJson = (await weatherRes.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
        };
        const current = weatherJson.current;
        if (typeof current?.temperature_2m === "number" && typeof current?.weather_code === "number") {
          setWeatherLabel(`${Math.round(current.temperature_2m)}°F ${weatherCodeToLabel(current.weather_code)}`);
          setWeatherTemp(Math.round(current.temperature_2m));
          setWeatherCode(current.weather_code);
        }
      } catch {
        // Silent fallback
      }
    }
    fetchLocationAndWeather();
  }, []);

  const weeklyData = useMemo(() => {
    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
    const now = new Date();
    const todayIdx = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const counts = new Array(7).fill(0) as number[];
    for (const task of allTasks) {
      if (!task.completed || !task.updatedAt) continue;
      const d = new Date(task.updatedAt);
      if (d >= startOfWeek && d <= now) {
        counts[d.getDay()]++;
      }
    }
    return dayLabels.map((day, i) => ({ day, count: counts[i], isToday: i === todayIdx }));
  }, [allTasks]);

  if (!mounted) return null;

  const taskPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  const quickActions = [
    { label: "Task", href: "/tasks?create=true", icon: CheckSquare, color: "text-violet-500 bg-violet-500/10" },
    { label: "Note", href: "/notes?create=true", icon: StickyNote, color: "text-blue-500 bg-blue-500/10" },
    { label: "Trade", href: "/finance?create=true", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Trip", href: "/travel?create=true", icon: Plane, color: "text-orange-500 bg-orange-500/10" },
  ];

  return (
    <>
      <TopBar title="NVision One" />
      <div className="p-4 space-y-5 pb-24">

        {/* ── Hero Section ──────────────────────── */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold tracking-tight">
            Good {getGreeting()}
          </h2>
          <div className="flex items-center gap-3 mt-1.5">
            {locationLabel && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </span>
            )}
            {weatherTemp !== null && weatherCode !== null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-sm">{weatherCodeToEmoji(weatherCode)}</span>
                {weatherTemp}°F
              </span>
            )}
          </div>
        </div>

        {/* ── Task Progress + Overdue Banner ──── */}
        <div className="animate-fade-in" style={{ animationDelay: "60ms" }}>
          <Link href="/tasks">
            <Card className="p-0 overflow-hidden border-0 shadow-md">
              <div className="flex items-center gap-4 p-4">
                <div className="relative shrink-0">
                  <ProgressRing percent={taskPercent} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {taskPercent}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Tasks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.completedTasks} of {stats.totalTasks} completed
                  </p>
                  {stats.pendingTasks > 0 && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {stats.pendingTasks} remaining
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </div>
              {stats.overdueTasks > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border-t border-rose-500/20">
                  <CircleAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <p className="text-[11px] font-medium text-rose-500">
                    {stats.overdueTasks} overdue {stats.overdueTasks === 1 ? "task" : "tasks"}
                  </p>
                </div>
              )}
            </Card>
          </Link>
        </div>

        {/* ── Feature Cards Row ─────────────── */}
        <div className="grid grid-cols-3 gap-2.5 animate-fade-in" style={{ animationDelay: "120ms" }}>
          <Link href="/notes">
            <Card className="text-center p-3 border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <StickyNote className="h-4.5 w-4.5 text-blue-500" />
              </div>
              <p className="text-lg font-bold tracking-tight">{stats.totalNotes}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</p>
            </Card>
          </Link>

          <Link href="/finance">
            <Card className="text-center p-3 border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
              </div>
              <p className="text-lg font-bold tracking-tight">{stats.totalWatching}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stocks</p>
            </Card>
          </Link>

          <Link href="/travel">
            <Card className="text-center p-3 border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                <Plane className="h-4.5 w-4.5 text-orange-500" />
              </div>
              <p className="text-lg font-bold tracking-tight">{stats.totalTrips}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trips</p>
            </Card>
          </Link>
        </div>

        {/* ── Upcoming Trip ─────────────────── */}
        {stats.nextTripDays !== null && (
          <div className="animate-fade-in" style={{ animationDelay: "180ms" }}>
            <Link href="/travel">
              <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-r from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shrink-0">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{stats.nextTripName}</p>
                    {stats.nextTripDestination && (
                      <p className="text-[11px] text-muted-foreground truncate">{stats.nextTripDestination}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-orange-500">
                      {stats.nextTripDays === 0 ? "Today!" : `${stats.nextTripDays}d`}
                    </p>
                    {stats.nextTripDays > 0 && (
                      <p className="text-[10px] text-muted-foreground">until trip</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* ── Quick Actions ─────────────────── */}
        <div className="animate-fade-in" style={{ animationDelay: "240ms" }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Create
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/40 py-3 hover:border-primary/40 hover:shadow-sm transition-all active:scale-95"
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${action.color}`}>
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Weekly Activity ───────────────── */}
        {weeklyData.some((d) => d.count > 0) && (
          <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                This Week
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {weeklyData.reduce((a, d) => a + d.count, 0)} completed
              </span>
            </div>
            <Card className="py-3 px-1 border-0 shadow-md">
              <ResponsiveContainer width="100%" height={72}>
                <BarChart data={weeklyData} barSize={20}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0} completed`, "Tasks"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── Upcoming Tasks / Reminders ────── */}
        {reminders.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: "360ms" }}>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming
              </h3>
              <Link href="/tasks" className="text-[11px] text-primary font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {reminders.map((task) => {
                const isOverdue = !!task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
                return (
                  <Card
                    key={task.id}
                    className={`p-3 border-0 shadow-sm ${isOverdue ? "ring-1 ring-rose-500/20 bg-rose-500/[0.03]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isOverdue ? "bg-rose-500/10" : "bg-primary/10"}`}>
                        <CalendarClock className={`h-3.5 w-3.5 ${isOverdue ? "text-rose-500" : "text-primary"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium line-clamp-1">{task.title}</p>
                        {task.dueDate && (
                          <p className={`text-[11px] mt-0.5 ${isOverdue ? "text-rose-500 font-medium" : "text-muted-foreground"}`}>
                            {isOverdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                      <Badge
                        className="text-[9px] shrink-0"
                        variant={isOverdue ? "destructive" : task.priority === "urgent" ? "destructive" : task.priority === "high" ? "warning" : "outline"}
                      >
                        {isOverdue ? "overdue" : task.priority}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
