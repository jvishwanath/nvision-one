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
      const upcoming = allTasks
        .filter((task) => !task.completed && task.dueDate)
        .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
        .slice(0, 3);
      setStats({ totalTasks, completedTasks, totalNotes, totalWatching, totalTrips });
      setReminders(upcoming);
    }
    loadStats();
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
      <TopBar title="LifeOS" />
      <div className="p-4 space-y-6">
        {/* Hero */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Good {getGreeting()}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your life at a glance
          </p>
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
