import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { type VariantProps } from "class-variance-authority";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * AlertDialog: a confirmation dialog that understands real-world confirmations.
 *
 * The problem with a plain alert dialog: the confirm button closes it instantly,
 * even though the real work (cancel an order, delete a product) is async and can
 * fail. The user gets no feedback, can double-click, and a failure is invisible.
 *
 * So this one is built around the async case:
 *
 *   <AlertDialog tone="destructive">
 *     <AlertDialogTrigger asChild><Button>Delete product</Button></AlertDialogTrigger>
 *     <AlertDialogContent>
 *       <AlertDialogHeader>
 *         <AlertDialogMedia />
 *         <AlertDialogTitle>Delete this product?</AlertDialogTitle>
 *         <AlertDialogDescription>Its photos and stock are removed.</AlertDialogDescription>
 *       </AlertDialogHeader>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Keep it</AlertDialogCancel>
 *         <AlertDialogAction onConfirm={() => api.deleteProduct(id)}>Delete</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 *
 * - `tone` on the root drives the accent edge, the icon and the action button.
 * - `onConfirm` may return a promise. While it runs the dialog stays open, the
 *   action shows a spinner, double-clicks are ignored, and Cancel / Escape /
 *   outside clicks are locked. On success the dialog closes. On failure it stays
 *   open and shows the error next to the buttons so the user can retry.
 * - Without `onConfirm` it behaves like a normal Radix alert dialog.
 *
 * Layout: bottom sheet on phones (safe-area aware, uses dvh), centered modal from
 * `sm` up. Logical properties throughout, so it mirrors correctly in RTL.
 */

type Tone = "default" | "destructive" | "warning" | "success";

const toneStyles: Record<
  Tone,
  { edge: string; media: string; icon: React.ElementType }
> = {
  default: {
    edge: "border-t-primary",
    media: "bg-primary/10 text-primary",
    icon: CircleHelp,
  },
  destructive: {
    edge: "border-t-destructive",
    media: "bg-destructive/10 text-destructive",
    icon: CircleAlert,
  },
  warning: {
    edge: "border-t-amber-500",
    media:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    icon: TriangleAlert,
  },
  success: {
    edge: "border-t-emerald-500",
    media:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: CircleCheck,
  },
};

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

type DialogState = {
  tone: Tone;
  pending: boolean;
  error: string | null;
  setPending: (value: boolean) => void;
  setError: (message: string | null) => void;
  close: () => void;
};

const DialogContext = React.createContext<DialogState>({
  tone: "default",
  pending: false,
  error: null,
  setPending: () => {},
  setError: () => {},
  close: () => {},
});

const useDialogState = () => React.useContext(DialogContext);

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

type AlertDialogProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Root
> & {
  tone?: Tone;
};

function AlertDialog({
  tone = "default",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: AlertDialogProps) {
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const [pending, setPendingState] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // A ref mirrors `pending` so guards never read a stale value mid-event.
  const pendingRef = React.useRef(false);
  const setPending = React.useCallback((value: boolean) => {
    pendingRef.current = value;
    setPendingState(value);
  }, []);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : innerOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!next && pendingRef.current) return; // locked while work is running
      if (!isControlled) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Fresh start every time the dialog opens.
  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const value = React.useMemo<DialogState>(
    () => ({
      tone,
      pending,
      error,
      setPending,
      setError,
      close: () => setOpen(false),
    }),
    [tone, pending, error, setPending, setOpen],
  );

  return (
    <DialogContext.Provider value={value}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    </DialogContext.Provider>
  );
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Content: bottom sheet on phones, centered modal from sm             */
/* ------------------------------------------------------------------ */

function AlertDialogContent({
  className,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const { tone, pending } = useDialogState();

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-tone={tone}
        aria-busy={pending || undefined}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
          onEscapeKeyDown?.(event);
        }}
        className={cn(
          "fixed z-50 flex flex-col gap-5 overflow-y-auto overscroll-contain bg-background shadow-xl outline-none duration-200",

          // Tone shows as a thick top edge
          "border-t-4",
          toneStyles[tone].edge,

          // Phones: bottom sheet
          "inset-x-0 bottom-0 max-h-[calc(100dvh-1rem)] rounded-t-2xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",

          // sm and up: centered modal
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border sm:border-t-4 sm:p-6",

          // Motion: slide up on phones, zoom on larger screens
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom",
          "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
          "motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

/* ------------------------------------------------------------------ */
/* Header, media, title, description                                   */
/* ------------------------------------------------------------------ */

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "group/header grid gap-1.5 text-start",
        "has-[[data-slot=alert-dialog-media]]:grid-cols-[auto_1fr] has-[[data-slot=alert-dialog-media]]:gap-x-4",
        className,
      )}
      {...props}
    />
  );
}

/** Round icon beside the title. Picks an icon from the root's tone unless you pass children. */
function AlertDialogMedia({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { tone } = useDialogState();
  const Icon = toneStyles[tone].icon;

  return (
    <div
      data-slot="alert-dialog-media"
      aria-hidden="true"
      className={cn(
        "row-span-2 flex size-11 shrink-0 items-center justify-center rounded-full [&>svg]:size-5",
        toneStyles[tone].media,
        className,
      )}
      {...props}
    >
      {children ?? <Icon />}
    </div>
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg leading-snug font-semibold text-balance break-words",
        "group-has-[[data-slot=alert-dialog-media]]/header:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-sm leading-relaxed text-pretty break-words text-muted-foreground",
        "group-has-[[data-slot=alert-dialog-media]]/header:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Footer: error line + buttons                                        */
/* ------------------------------------------------------------------ */

function AlertDialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { error } = useDialogState();

  return (
    <div data-slot="alert-dialog-footer" className="grid gap-3">
      {error && (
        <p
          role="alert"
          data-slot="alert-dialog-error"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm break-words text-destructive"
        >
          {error}
        </p>
      )}
      <div
        className={cn(
          // Phones: stacked with the primary action on top (thumb zone).
          // sm+: one row with the primary action on the trailing side.
          "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonStyleProps = Pick<
  VariantProps<typeof buttonVariants>,
  "variant" | "size"
>;

const footerButton =
  "max-sm:h-11 max-sm:w-full aria-disabled:pointer-events-none aria-disabled:opacity-60";

type AlertDialogActionProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Action
> &
  ButtonStyleProps & {
    /**
     * Work to run on confirm. May be async. The dialog stays open and locked
     * while it runs, closes when it resolves, and shows the error if it throws.
     */
    onConfirm?: () => void | Promise<void>;
  };

function AlertDialogAction({
  className,
  variant,
  size,
  onConfirm,
  onClick,
  children,
  ...props
}: AlertDialogActionProps) {
  const { tone, pending, setPending, setError, close } = useDialogState();

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // aria-disabled instead of disabled: the button keeps keyboard focus while busy.
    if (pending) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (!onConfirm || event.defaultPrevented) return;

    event.preventDefault(); // stop Radix from closing; we close after the work succeeds
    setError(null);
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      close();
    } catch (err) {
      setPending(false);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      aria-disabled={pending || undefined}
      className={cn(
        buttonVariants({
          variant:
            variant ?? (tone === "destructive" ? "destructive" : "default"),
          size,
        }),
        footerButton,
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {pending && (
        <Loader2
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {children}
    </AlertDialogPrimitive.Action>
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size,
  onClick,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  ButtonStyleProps) {
  const { pending } = useDialogState();

  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      aria-disabled={pending || undefined}
      className={cn(buttonVariants({ variant, size }), footerButton, className)}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
export type { AlertDialogProps, Tone as AlertDialogTone };
