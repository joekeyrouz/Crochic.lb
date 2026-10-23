import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/shop";
import { trpc } from "@/providers/trpc";

type CustomerRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  orderCount: number;
};

type CustomerForm = Omit<CustomerRecord, "id" | "orderCount">;

const EMPTY_FORM: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(
    null,
  );
  const [deletingCustomer, setDeletingCustomer] =
    useState<CustomerRecord | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const utils = trpc.useUtils();
  const {
    data: customers,
    isLoading,
    error,
  } = trpc.admin.customers.useQuery({
    search: search || undefined,
  });

  const updateCustomer = trpc.admin.updateCustomer.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.customers.invalidate(),
        utils.admin.orders.invalidate(),
        utils.admin.order.invalidate(),
      ]);
      setEditingCustomer(null);
      toast.success("Customer details updated");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const deleteCustomer = trpc.admin.deleteCustomer.useMutation({
    onSuccess: async () => {
      await utils.admin.customers.invalidate();
      setDeletingCustomer(null);
      toast.success("Customer deleted");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  function openEditor(customer: CustomerRecord) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      country: customer.country ?? "",
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;
    updateCustomer.mutate({
      id: editingCustomer.id,
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
    });
  }

  return (
    <div className="min-w-0">
      <h1 className="mb-6 font-display text-3xl sm:mb-8 sm:text-4xl">
        Customers
      </h1>
      <input
        type="search"
        aria-label="Search customers by name or email"
        placeholder="Search name or email…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-6 w-full max-w-sm border border-crochic-blush bg-crochic-ivory px-4 py-3 text-sm focus:border-crochic-rose focus:outline-none sm:mb-8"
      />
      <div className="overflow-x-auto border border-crochic-blush bg-crochic-ivory">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-crochic-blush text-left text-[11px] uppercase tracking-[0.14em] text-crochic-muted">
              <th scope="col" className="px-5 py-4">
                Customer
              </th>
              <th scope="col" className="px-5 py-4">
                Phone
              </th>
              <th scope="col" className="px-5 py-4">
                Orders
              </th>
              <th scope="col" className="px-5 py-4">
                Total spent
              </th>
              <th scope="col" className="px-5 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crochic-blush">
            {customers?.map((customer) => (
              <tr key={customer.id} className="hover:bg-crochic-blush/10">
                <td className="px-5 py-3">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-crochic-muted">{customer.email}</p>
                </td>
                <td className="px-5 py-3 text-crochic-muted">
                  {customer.phone || "—"}
                </td>
                <td className="px-5 py-3">{customer.orderCount}</td>
                <td className="px-5 py-3 font-medium">
                  {formatPrice(customer.totalSpent)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="p-2 hover:text-crochic-rose"
                      aria-label={`Edit ${customer.name}`}
                      onClick={() => openEditor(customer)}
                    >
                      <Pencil aria-hidden="true" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:text-red-600"
                      aria-label={`Delete ${customer.name}`}
                      onClick={() => setDeletingCustomer(customer)}
                      disabled={deleteCustomer.isPending}
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <p
            role="status"
            className="p-8 text-center text-sm text-crochic-muted"
          >
            Loading customers…
          </p>
        )}
        {error && (
          <p role="alert" className="p-8 text-center text-sm text-destructive">
            Could not load customers: {error.message}
          </p>
        )}
        {!isLoading && !error && customers?.length === 0 && (
          <p className="p-8 text-center text-sm italic text-crochic-muted">
            No customers yet.
          </p>
        )}
      </div>

      <Dialog
        open={editingCustomer !== null}
        onOpenChange={(open) => {
          if (!open && !updateCustomer.isPending) setEditingCustomer(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              Update this customer’s contact and address details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium">
              Name
              <Input
                required
                maxLength={160}
                autoComplete="name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Email
              <Input
                required
                type="email"
                maxLength={320}
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Phone
              <Input
                type="tel"
                maxLength={60}
                autoComplete="tel"
                value={form.phone ?? ""}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Address
              <Input
                maxLength={300}
                autoComplete="street-address"
                value={form.address ?? ""}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">
                City
                <Input
                  maxLength={120}
                  autoComplete="address-level2"
                  value={form.city ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Country
                <Input
                  maxLength={120}
                  autoComplete="country-name"
                  value={form.country ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                />
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCustomer(null)}
                disabled={updateCustomer.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingCustomer !== null}
        onOpenChange={(open) => {
          if (!open && !deleteCustomer.isPending) setDeletingCustomer(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCustomer?.orderCount
                ? `${deletingCustomer.name} has ${deletingCustomer.orderCount} order(s). Customers with order history cannot be deleted.`
                : `This will permanently delete ${deletingCustomer?.name ?? "this customer"}’s record. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCustomer.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteCustomer.isPending ||
                (deletingCustomer?.orderCount ?? 0) > 0
              }
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (deletingCustomer && deletingCustomer.orderCount === 0) {
                  deleteCustomer.mutate({ id: deletingCustomer.id });
                }
              }}
            >
              {deleteCustomer.isPending ? "Deleting…" : "Delete customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
