"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";

type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  title: string | null;
  contactType: string | null;
  tags: string[] | null;
  createdAt: string;
};

export default function ContactsPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    title: "",
    contactType: "",
    notes: "",
  });

  const { data, isLoading, refetch } = trpc.contacts.list.useQuery();
  const { data: stats } = trpc.contacts.stats.useQuery();

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact created");
      setCreateOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        title: "",
        contactType: "",
        notes: "",
      });
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted");
      refetch();
    },
  });

  const columns: ColumnDef<Contact>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-bold">
              {row.original.firstName?.[0]}
              {row.original.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </p>
            {row.original.title && (
              <p className="text-xs text-muted-foreground">
                {row.original.title}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.email}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">--</span>
        ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.original.phone ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.phone}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">--</span>
        ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) =>
        row.original.companyName ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.companyName}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">--</span>
        ),
    },
    {
      accessorKey: "contactType",
      header: "Type",
      cell: ({ row }) =>
        row.original.contactType ? (
          <Badge variant="outline" className="text-xs capitalize">
            {row.original.contactType}
          </Badge>
        ) : null,
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) =>
        row.original.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(row.original.tags?.length ?? 0) > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{(row.original.tags?.length ?? 0) - 3}
              </Badge>
            )}
          </div>
        ) : null,
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/contacts/${row.original.id}`)
              }
            >
              <Edit className="mr-2 h-4 w-4" /> View / Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() =>
                deleteContact.mutate({ id: row.original.id })
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const allContacts = (data?.contacts ?? []) as Contact[];

  if (!isLoading && allContacts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">
              Your CRM for managing all event attendees and contacts.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No contacts yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Contacts are automatically created when you add guests to events.
            You can also create contacts manually.
          </p>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" /> Add First Contact
              </Button>
            </DialogTrigger>
            <CreateContactDialog
              formData={formData}
              setFormData={setFormData}
              isPending={createContact.isPending}
              onSubmit={() => createContact.mutate(formData)}
            />
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            {stats?.total ?? 0} contact{(stats?.total ?? 0) !== 1 ? "s" : ""} in your CRM
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          </DialogTrigger>
          <CreateContactDialog
            formData={formData}
            setFormData={setFormData}
            isPending={createContact.isPending}
            onSubmit={() => createContact.mutate(formData)}
          />
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={allContacts}
        searchKey="firstName"
        searchPlaceholder="Search contacts..."
        isLoading={isLoading}
      />
    </div>
  );
}

function CreateContactDialog({
  formData,
  setFormData,
  isPending,
  onSubmit,
}: {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string;
    title: string;
    contactType: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  isPending: boolean;
  onSubmit: () => void;
}) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add Contact</DialogTitle>
        <DialogDescription>
          Create a new contact in your CRM.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-firstName">First Name *</Label>
            <Input
              id="c-firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((d) => ({ ...d, firstName: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-lastName">Last Name</Label>
            <Input
              id="c-lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((d) => ({ ...d, lastName: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((d) => ({ ...d, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-phone">Phone</Label>
            <Input
              id="c-phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((d) => ({ ...d, phone: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-company">Company</Label>
            <Input
              id="c-company"
              value={formData.companyName}
              onChange={(e) =>
                setFormData((d) => ({ ...d, companyName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-title">Job Title</Label>
            <Input
              id="c-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-notes">Notes</Label>
          <Textarea
            id="c-notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((d) => ({ ...d, notes: e.target.value }))
            }
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Contact"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
