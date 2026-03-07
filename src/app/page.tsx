"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/top-bar";
import {
  CheckSquare,
  StickyNote,
  TrendingUp,
  Plane,
  Sparkles,
  ChevronRight,
  AlarmClock,
} from "lucide-react";
import Link from "next/link";
import { taskRepository } from "@/features/tasks/repository";
import { noteRepository } from "@/features/notes/repository";
import { watchlistRepository } from "@/features/finance/repository";
import { travelRepository } from "@/features/travel/repository";
import type { Task } from "@/features/tasks/types";
import { formatDate } from "@/lib/utils";

type WeatherData = {
  temperature: number;
  code: number;
};

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

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalNotes: number;
  totalWatching: number;
  totalTrips: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalNotes: 0,
    totalWatching: 0,
    totalTrips: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [reminders, setReminders] = useState<Task[]>([]);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [weatherLabel, setWeatherLabel] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    async function loadStats() {
      const [totalTasks, totalNotes, totalWatching, totalTrips] = await Promise.all([
        taskRepository.count(),
        noteRepository.count(),
        watchlistRepository.count(),
        travelRepository.countTrips(),
      ]);
      // Dexie where("completed").equals(1) doesn't work for booleans, use filter
      const allTasks = await taskRepository.getAll();
      const completedTasks = allTasks.filter((t) => t.completed).length;
      const now = Date.now();
      const tenDaysFromNow = now + 10 * 24 * 60 * 60 * 1000;
      const upcoming = allTasks
        .filter((task) => {
          if (task.completed || !task.dueDate) return false;
          const dueAt = new Date(task.dueDate).getTime();
          return Number.isFinite(dueAt) && dueAt >= now && dueAt <= tenDaysFromNow;
        })
        .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
        .slice(0, 3);
      setStats({ totalTasks, completedTasks, totalNotes, totalWatching, totalTrips });
      setReminders(upcoming);
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function fetchLocationAndWeather() {
      try {
        // IP-based geolocation (geojs.io: free, CORS-enabled, no key needed)
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

        // Weather from Open-Meteo (CORS-enabled)
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
        }
      } catch {
        // Silent fallback: greeting stays visible without weather/location.
      }
    }
    fetchLocationAndWeather();
  }, []);

  if (!mounted) return null;

  const cards = [
    {
      title: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      subtitle: "completed",
      gradient: "from-violet-500 to-purple-600",
      shadowColor: "shadow-violet-500/20",
    },
    {
      title: "Notes",
      href: "/notes",
      icon: StickyNote,
      value: stats.totalNotes.toString(),
      subtitle: "notes saved",
      gradient: "from-blue-500 to-cyan-500",
      shadowColor: "shadow-blue-500/20",
    },
    {
      title: "Finance",
      href: "/finance",
      icon: TrendingUp,
      value: stats.totalWatching.toString(),
      subtitle: "stocks watching",
      gradient: "from-emerald-500 to-green-600",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      title: "Travel",
      href: "/travel",
      icon: Plane,
      value: stats.totalTrips.toString(),
      subtitle: "trips planned",
      gradient: "from-orange-500 to-amber-500",
      shadowColor: "shadow-orange-500/20",
    },
  ];

  return (
    <>
      <TopBar title="NVision One" />
      <div className="p-4 space-y-6">
        {/* Hero */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Good {getGreeting()}</h2>
          </div>
          {locationLabel || weatherLabel ? (
            <p className="text-xs text-muted-foreground mb-1">
              {locationLabel ?? ""}
              {locationLabel && weatherLabel ? " · " : ""}
              {weatherLabel ?? ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Here&apos;s your life at a glance
            </p>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-in">
                <Card
                  className={`relative overflow-hidden border-0 shadow-lg ${card.shadowColor} h-full`}
                >
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.08] dark:opacity-[0.15]`}
                  />
                  <CardContent className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      {card.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: "Task", href: "/tasks?create=true", icon: CheckSquare },
              { label: "Note", href: "/notes?create=true", icon: StickyNote },
              { label: "Trade", href: "/finance?create=true", icon: TrendingUp },
              { label: "Trip", href: "/travel?create=true", icon: Plane },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="shrink-0 flex items-center gap-1.5 rounded-2xl border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Task Reminders */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Reminders
          </h3>
          <Card className="border-dashed">
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming tasks
              </p>
            ) : (
              <div className="space-y-3">
                {reminders.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <AlarmClock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <Badge className="text-[10px]" variant="outline">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
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
