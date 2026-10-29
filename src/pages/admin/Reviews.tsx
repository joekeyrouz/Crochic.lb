import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Check, Trash2, Star, MessageSquare } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminReviews() {
  const utils = trpc.useUtils();
  const [reviewToReject, setReviewToReject] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">(
    "pending",
  );

  const { data: reviews, isLoading, error } = trpc.admin.reviews.useQuery();

  const approve = trpc.admin.approveReview.useMutation({
    onSuccess: () => utils.admin.reviews.invalidate(),
  });

  const reject = trpc.admin.rejectReview.useMutation({
    onSuccess: () => utils.admin.reviews.invalidate(),
  });

  const filteredReviews = (reviews ?? []).filter((review) => {
    if (filter === "pending") return !review.approved;
    if (filter === "approved") return review.approved;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review customer feedback before it appears in your shop.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "all"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-lg border px-4 py-2 text-sm capitalize ${
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {value}
            {value === "pending" && reviews
              ? ` (${reviews.filter((review) => !review.approved).length})`
              : ""}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : error ? (
        <p className="text-sm text-red-600">
          Could not load reviews: {error.message}
        </p>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">
            No {filter === "all" ? "" : filter} reviews
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <article key={review.id} className="rounded-xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{review.customerName}</p>
                  <div className="mt-1 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < review.rating
                            ? "fill-current"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-muted-foreground">
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {review.review}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${
                      review.approved
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {review.approved ? "Approved" : "Awaiting approval"}
                  </span>
                </div>

                <div className="flex shrink-0 gap-2">
                  {!review.approved && (
                    <button
                      onClick={() => approve.mutate({ id: review.id })}
                      disabled={approve.isPending || reject.isPending}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => setReviewToReject(review.id)}
                    disabled={approve.isPending || reject.isPending}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog
        open={reviewToReject !== null}
        onOpenChange={(open) => {
          if (!open) setReviewToReject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer review. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reviewToReject !== null) {
                  reject.mutate({ id: reviewToReject });
                }
                setReviewToReject(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
