"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Shield,
  Server,
  Layers,
  Code2,
  GitCommit,
  type LucideIcon,
} from "lucide-react";
import { MetaPageNav } from "@shared/components/common/MetaPageNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceStatus = "operational" | "degraded" | "down";
type OverallStatus = ServiceStatus;

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  detail: string;
}

interface SystemInfo {
  framework: string;
  runtime: string;
  database: string;
  auth: string;
  cache: string;
  testCount: number;
  endpointCount: number;
  models: number;
}

interface HealthResponse {
  status: OverallStatus;
  timestamp: string;
  checks: ServiceCheck[];
  system: SystemInfo;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<OverallStatus, { label: string; icon: LucideIcon; bannerClass: string; iconClass: string }> = {
  operational: {
    label: "All Systems Operational",
    icon: CheckCircle2,
    bannerClass: "bg-emerald-500 dark:bg-emerald-600",
    iconClass: "text-white",
  },
  degraded: {
    label: "Partial Degradation",
    icon: AlertTriangle,
    bannerClass: "bg-amber-500 dark:bg-amber-600",
    iconClass: "text-white",
  },
  down: {
    label: "Service Disruption",
    icon: XCircle,
    bannerClass: "bg-red-500 dark:bg-red-600",
    iconClass: "text-white",
  },
};

const serviceIcons: Record<string, LucideIcon> = {
  Database: Database,
  "Auth Provider": Shield,
  "Data Layer": Layers,
  "API Server": Server,
};

const checkStatusConfig: Record<ServiceStatus, { icon: LucideIcon; className: string; dotClass: string }> = {
  operational: { icon: CheckCircle2, className: "text-emerald-500", dotClass: "bg-emerald-500" },
  degraded: { icon: AlertTriangle, className: "text-amber-500", dotClass: "bg-amber-500" },
  down: { icon: XCircle, className: "text-red-500", dotClass: "bg-red-500" },
};

// ---------------------------------------------------------------------------
// System info grid items
// ---------------------------------------------------------------------------

const systemInfoItems = (sys: SystemInfo) => [
  { label: "Frontend", value: sys.framework, icon: Code2 },
  { label: "Runtime", value: sys.runtime, icon: Server },
  { label: "Database", value: sys.database, icon: Database },
  { label: "Auth", value: sys.auth, icon: Shield },
  { label: "Cache", value: sys.cache, icon: Layers },
  { label: "Unit Tests", value: `${sys.testCount} passing`, icon: Activity },
  { label: "Server Actions", value: `${sys.endpointCount} endpoints`, icon: GitCommit },
  { label: "DB Models", value: `${sys.models} models`, icon: Database },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const card = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg";
const accentIcon = "text-red-600 dark:text-red-500";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StatusPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = performance.now();
      const res = await fetch("/api/health", { cache: "no-store" });
      const latency = Math.round(performance.now() - start);
      setApiLatency(latency);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch health status");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Determine overall status for banner
  const overallStatus: OverallStatus = error ? "down" : data?.status ?? "operational";
  const bannerConfig = statusConfig[overallStatus];
  const BannerIcon = bannerConfig.icon;

  // Build the full checks list including the client-side API check
  const allChecks: ServiceCheck[] = [];
  if (apiLatency !== null) {
    allChecks.push({
      name: "API Server",
      status: error ? "down" : apiLatency > 2000 ? "degraded" : "operational",
      latencyMs: apiLatency,
      detail: error ? `Connection failed: ${error}` : `Next.js API route — ${apiLatency}ms from client`,
    });
  }
  if (data?.checks) {
    allChecks.push(...data.checks);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className={`h-7 w-7 ${accentIcon}`} />
            <span className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              System Status
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            BBQ Judge — Status
          </h1>
        </div>
      </header>

      <MetaPageNav currentPath="/status" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── 1. Overall Status Banner ────────────────────────────────── */}
        <div className={`${bannerConfig.bannerClass} rounded-lg p-6 text-white`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {loading ? (
                <Spinner className="text-white" />
              ) : (
                <BannerIcon className={`h-7 w-7 ${bannerConfig.iconClass}`} />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {loading ? "Checking Systems..." : bannerConfig.label}
                </h2>
                {data?.timestamp && (
                  <p className="text-sm text-white/80 mt-0.5">
                    Last checked: {formatTimestamp(data.timestamp)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── 2. Individual Health Checks ─────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Service Health</h2>

          {loading && allChecks.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["API Server", "Database", "Auth Provider", "Data Layer"].map((name) => (
                <div key={name} className={`${card} p-5`}>
                  <div className="flex items-center gap-3">
                    <Spinner className="text-slate-400" />
                    <div>
                      <div className="font-medium text-sm">{name}</div>
                      <div className="text-xs text-slate-400">Checking...</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allChecks.map((check) => {
                const config = checkStatusConfig[check.status];
                const StatusIcon = config.icon;
                const ServiceIcon = serviceIcons[check.name] || Server;

                return (
                  <div key={check.name} className={`${card} p-5`}>
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <ServiceIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <StatusIcon className={`h-4 w-4 ${config.className} absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{check.name}</span>
                          <span className={`w-2 h-2 rounded-full ${config.dotClass} shrink-0`} />
                          {check.latencyMs >= 0 && (
                            <span className="text-xs font-mono text-slate-400 ml-auto">
                              {check.latencyMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {check.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && !loading && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                <span className="font-bold">Error:</span> {error}
              </p>
            </div>
          )}
        </section>

        {/* ── 3. System Information ───────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold mb-4">System Information</h2>

          {data?.system ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {systemInfoItems(data.system).map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`${card} p-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${accentIcon}`} />
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{item.value}</div>
                  </div>
                );
              })}
            </div>
          ) : loading ? (
            <div className={`${card} p-8 flex items-center justify-center gap-3`}>
              <Spinner className="text-slate-400" />
              <span className="text-sm text-slate-400">Loading system information...</span>
            </div>
          ) : (
            <div className={`${card} p-8 text-center text-sm text-slate-400`}>
              System information unavailable
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Built with Claude Code
          </p>
        </footer>
      </main>
    </div>
  );
}
