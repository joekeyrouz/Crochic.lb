import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Alert
 *
 * Design decisions:
 * - Responds to its CONTAINER width (@container), not the viewport. The same
 *   alert works in a narrow cart drawer, a checkout column, or a full-width banner.
 * - Severity is never color-only: each variant has its own icon shape and a
 *   dashed "stitch" rail on the leading edge.
 * - Logical properties only (ps/pe/start/end), so it mirrors correctly in RTL (Arabic).
 * - role="alert" (assertive) only for destructive/warning. Everything else is
 *   role="status" (polite) so screen readers aren't interrupted by non-urgent info.
 * - Title is never line-clamped: clipped error text is a bug, especially on phones.
 */

const alertVariants = cva(
  [
    "@container/alert relative w-full overflow-hidden rounded-xl border",
    "flex items-start gap-3 py-3 ps-5 pe-4 text-sm",
    // dashed stitch rail on the leading edge
    "before:pointer-events-none before:absolute before:inset-y-2.5 before:start-2",
    "before:border-s-2 before:border-dashed before:border-current before:opacity-60 before:content-['']",
  ],
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
        warning:
          "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
        destructive:
          "border-destructive/30 bg-destructive/5 text-destructive dark:bg-destructive/10",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const defaultIcons: Record<AlertVariant, React.ElementType> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Custom icon, or `false` to hide it. Defaults to one matching the variant. */
    icon?: React.ReactNode | false;
    /** When provided, a dismiss button is rendered and calls this on click. */
    onDismiss?: () => void;
    /** Accessible label for the dismiss button (pass a translated string). */
    dismissLabel?: string;
  };

function Alert({
  className,
  variant,
  icon,
  onDismiss,
  dismissLabel = "Dismiss",
  children,
  ...props
}: AlertProps) {
  const resolved: AlertVariant = variant ?? "default";
  const Icon = defaultIcons[resolved];
  const urgent = resolved === "destructive" || resolved === "warning";

  return (
    <div
      data-slot="alert"
      role={urgent ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon !== false && (
        <span
          data-slot="alert-icon"
          aria-hidden="true"
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center [&>svg]:size-4"
        >
          {icon ?? <Icon />}
        </span>
      )}

      {/* Body: stacked when narrow, text + action side by side from ~28rem container */}
      <div
        data-slot="alert-body"
        className="grid min-w-0 flex-1 grid-cols-1 gap-y-1 @md/alert:grid-cols-[1fr_auto] @md/alert:gap-x-4"
      >
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          data-slot="alert-dismiss"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn(
            "relative -me-1.5 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md",
            "opacity-70 transition-opacity hover:opacity-100",
            "focus-visible:ring-ring/50 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:outline-none",
            // enlarge touch target to ~44px without changing layout
            "after:absolute after:-inset-1.5 after:content-['']",
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-1 font-medium leading-snug tracking-tight text-balance break-words",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-1 grid justify-items-start gap-1 text-sm leading-relaxed text-pretty break-words opacity-90 [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

/** Optional slot for a button or link. Sits under the text when narrow, beside it when wide. */
function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "col-start-1 mt-2 flex flex-wrap items-center gap-2",
        "@md/alert:col-start-2 @md/alert:row-span-2 @md/alert:row-start-1 @md/alert:mt-0 @md/alert:self-center",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
