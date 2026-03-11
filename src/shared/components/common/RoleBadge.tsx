import { cn } from "@/shared/lib/utils";
import type { UserRole } from "@/shared/constants/kcbs";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const config: Record<UserRole, { label: string; classes: string }> = {
  JUDGE: {
    label: "Judge",
    classes:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  TABLE_CAPTAIN: {
    label: "Table Captain",
    classes:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  },
  ORGANIZER: {
    label: "Organizer",
    classes:
      "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { label, classes } = config[role];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}
