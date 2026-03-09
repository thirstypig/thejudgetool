"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Flame,
  LayoutDashboard,
  Trophy,
  Settings,
  BarChart3,
  Users,
  ClipboardList,
  CheckSquare,
  AlertCircle,
  BookOpen,
  Home,
  LogOut,
  Menu,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import { UserAvatar } from "@/shared/components/common/UserAvatar";
import { useCompetition, getCompetitions } from "@features/competition";
import { cn } from "@/shared/lib/utils";
import type { UserRole } from "@/shared/constants/kcbs";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const navItems: NavItem[] = [
  // --- Organizer: event lifecycle order ---
  {
    label: "Competitions",
    href: "/organizer",
    icon: Trophy,
    roles: ["ORGANIZER"],
  },
  {
    label: "Competitors",
    href: "/organizer/setup",
    icon: Settings,
    roles: ["ORGANIZER"],
  },
  {
    label: "Judges",
    href: "/organizer/judges",
    icon: Users,
    roles: ["ORGANIZER"],
  },
  {
    label: "Results",
    href: "/organizer/results",
    icon: BarChart3,
    roles: ["ORGANIZER"],
  },
  // --- Judge ---
  {
    label: "My Scorecards",
    href: "/judge",
    icon: ClipboardList,
    roles: ["JUDGE"],
  },
  // --- Table Captain ---
  {
    label: "My Table",
    href: "/captain",
    icon: LayoutDashboard,
    roles: ["TABLE_CAPTAIN"],
  },
  {
    label: "Score Review",
    href: "/captain/scores",
    icon: CheckSquare,
    roles: ["TABLE_CAPTAIN"],
  },
  {
    label: "Correction Requests",
    href: "/captain/corrections",
    icon: AlertCircle,
    roles: ["TABLE_CAPTAIN"],
  },
  // --- All roles ---
  {
    label: "Rules",
    href: "/rules",
    icon: BookOpen,
    roles: ["ORGANIZER", "JUDGE", "TABLE_CAPTAIN"],
  },
];

interface DashboardShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    cbjNumber: string;
  };
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    activeCompetition,
    competitions,
    setActiveCompetitionId,
    setCompetitions,
  } = useCompetition();

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  // Load competitions for organizer
  useEffect(() => {
    if (user.role === "ORGANIZER") {
      getCompetitions().then((comps) => {
        setCompetitions(comps);
        // Auto-select first if none selected
        if (comps.length > 0 && !activeCompetition) {
          setActiveCompetitionId(comps[0].id);
        }
      });
    }
  }, [user.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve competition-specific nav hrefs
  function resolveHref(item: NavItem): string {
    if (
      user.role === "ORGANIZER" &&
      activeCompetition &&
      (item.label === "Competitors" ||
        item.label === "Results" ||
        item.label === "Judges")
    ) {
      const suffix =
        item.label === "Competitors"
          ? "setup"
          : item.label === "Judges"
            ? "judges"
            : "results";
      return `/organizer/${activeCompetition.id}/${suffix}`;
    }
    return item.href;
  }

  function isActive(item: NavItem): boolean {
    const href = resolveHref(item);
    if (href === pathname) return true;
    // Match competition sub-routes
    if (
      item.label === "Competitors" &&
      pathname.includes("/setup")
    )
      return true;
    if (item.label === "Results" && pathname.includes("/results")) return true;
    if (item.label === "Judges" && pathname.includes("/judges")) return true;
    return false;
  }

  const displayNav = filteredNav;

  const sidebarContent = (
    <nav className="flex flex-col gap-1 p-3">
      {displayNav.map((item) => {
        const href = resolveHref(item);
        const active = isActive(item);
        const Icon = item.icon;
        const disabled =
          !activeCompetition &&
          user.role === "ORGANIZER" &&
          (item.label === "Competitors" ||
            item.label === "Results" ||
            item.label === "Judges");

        return (
          <Link
            key={item.label}
            href={disabled ? "#" : href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              disabled && "pointer-events-none opacity-40"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const isJudgeRole = user.role === "JUDGE" || user.role === "TABLE_CAPTAIN";

  // Minimal layout for judges on mobile: no sidebar, slim top bar
  if (isJudgeRole) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">BBQ Judge</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent">
                <UserAvatar
                  cbjNumber={user.cbjNumber}
                  role={user.role as UserRole}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="text-xs font-normal text-muted-foreground">
                    {user.name || user.cbjNumber}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = user.role === "TABLE_CAPTAIN" ? "/captain" : "/judge"}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = "/rules"}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Rules
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-2 sm:p-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-bold">BBQ Judge</span>
        </div>
        {sidebarContent}
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Flame className="h-5 w-5 text-primary" />
                  BBQ Judge
                </SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          {/* Competition selector (organizer only) */}
          {user.role === "ORGANIZER" && competitions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
                <Trophy className="mr-1 h-4 w-4 text-primary" />
                <span className="max-w-[200px] truncate">
                  {activeCompetition?.name ?? "Select competition"}
                </span>
                <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Competitions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {competitions.map((comp) => (
                  <DropdownMenuItem
                    key={comp.id}
                    onClick={() => setActiveCompetitionId(comp.id)}
                    className={cn(
                      activeCompetition?.id === comp.id && "bg-accent"
                    )}
                  >
                    {comp.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex-1" />

          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
              <UserAvatar
                cbjNumber={user.cbjNumber}
                role={user.role as UserRole}
              />
              <span className="hidden text-sm font-medium sm:inline">
                {user.name || user.cbjNumber}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="text-xs font-normal text-muted-foreground">
                  {user.cbjNumber} &middot; {user.role.replace("_", " ")}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
