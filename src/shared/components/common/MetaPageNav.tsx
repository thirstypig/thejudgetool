import Link from "next/link";
import {
  Code2,
  Target,
  GitCommit,
  Activity,
  BarChart3,
} from "lucide-react";

const metaPages = [
  { href: "/tech", label: "Under the Hood", icon: Code2 },
  { href: "/roadmap", label: "Roadmap", icon: Target },
  { href: "/changelog", label: "Changelog", icon: GitCommit },
  { href: "/status", label: "Status", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

interface MetaPageNavProps {
  currentPath: string;
}

export function MetaPageNav({ currentPath }: MetaPageNavProps) {
  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto -mb-px">
          {metaPages.map((page) => {
            const Icon = page.icon;
            const isActive = currentPath === page.href;
            return (
              <Link
                key={page.href}
                href={page.href}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-red-600 text-red-600 dark:border-red-500 dark:text-red-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {page.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
