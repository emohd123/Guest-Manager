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
  DropdownMenuSeparator,
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

import { motion } from "framer-motion";

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
          className="translate-y-[2px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
      header: "Contact Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <span className="text-sm font-black italic">
              {row.original.firstName?.[0]}
              {row.original.lastName?.[0]}
            </span>
          </div>
          <div className="flex flex-col">
            <p className="text-base font-bold leading-tight text-foreground">
              {row.original.firstName} {row.original.lastName}
            </p>
            {row.original.title && (
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {row.original.title}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email Address",
      cell: ({ row }) =>
        row.original.email ? (
          <div className="flex items-center gap-2 font-medium text-muted-foreground">
            <Mail className="h-4 w-4 text-primary" />
            {row.original.email}
          </div>
        ) : (
          <span className="text-muted-foreground/50">--</span>
        ),
    },
    {
      accessorKey: "companyName",
      header: "Organization",
      cell: ({ row }) =>
        row.original.companyName ? (
          <div className="flex items-center gap-2 font-medium text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            {row.original.companyName}
          </div>
        ) : (
          <span className="text-muted-foreground/50">--</span>
        ),
    },
    {
      accessorKey: "contactType",
      header: "Category",
      cell: ({ row }) =>
        row.original.contactType ? (
          <Badge className="rounded-full border-none bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {row.original.contactType}
          </Badge>
        ) : null,
    },
    {
      accessorKey: "createdAt",
      header: "Registration",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">
            {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Created</span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border border-border bg-popover p-2 text-popover-foreground">
            <DropdownMenuItem
              className="rounded-xl focus:bg-accent/10 focus:text-popover-foreground"
              onClick={() =>
                router.push(`/dashboard/contacts/${row.original.id}`)
              }
            >
              <Edit className="mr-2 h-4 w-4 text-primary" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-red-400 rounded-xl focus:bg-red-500/10 focus:text-red-400"
              onClick={() =>
                deleteContact.mutate({ id: row.original.id })
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const allContacts = (data?.contacts ?? []) as Contact[];

  if (!isLoading && allContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-full max-w-xl rounded-[40px] border border-border bg-card p-10 backdrop-blur-3xl"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 mb-8 group">
            <Users className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="mb-4 text-3xl font-black italic tracking-tight text-foreground">Your Network</h1>
          <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
            Your CRM is currently empty. Contacts are automatically created when guests register for events, or you can build your library manually.
          </p>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1">
                Add Your First Contact
              </Button>
            </DialogTrigger>
            <CreateContactDialog
              formData={formData}
              setFormData={setFormData}
              isPending={createContact.isPending}
              onSubmit={() => createContact.mutate(formData)}
              onClose={() => setCreateOpen(false)}
            />
          </Dialog>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground">Contacts</h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {stats?.total ?? 0} beautiful contact{(stats?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex h-14 gap-3 rounded-2xl border border-border bg-card px-8 text-base font-black text-foreground shadow-2xl transition-all hover:-translate-y-1 hover:bg-card/90">
              <Plus className="h-6 w-6" />
              Add Contact
            </Button>
          </DialogTrigger>
          <CreateContactDialog
            formData={formData}
            setFormData={setFormData}
            isPending={createContact.isPending}
            onSubmit={() => createContact.mutate(formData)}
            onClose={() => setCreateOpen(false)}
          />
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={allContacts}
        searchKey="firstName"
        searchPlaceholder="Find a contact..."
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
  onClose,
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
  onClose: () => void;
}) {
  return (
    <DialogContent className="sm:max-w-xl rounded-[40px] border border-border bg-popover p-0 text-popover-foreground overflow-hidden">
      <div className="border-b border-border bg-muted/30 p-8">
        <DialogTitle className="text-2xl font-black italic">New Contact</DialogTitle>
        <DialogDescription className="font-medium text-muted-foreground">
          Expand your network by adding a new contact.
        </DialogDescription>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="p-8 space-y-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-firstName" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">First Name *</Label>
            <Input
              id="c-firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((d) => ({ ...d, firstName: e.target.value }))
              }
              className="h-12 rounded-2xl border-border bg-card px-4 text-foreground focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-lastName" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Name</Label>
            <Input
              id="c-lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((d) => ({ ...d, lastName: e.target.value }))
              }
              className="h-12 rounded-2xl border-border bg-card px-4 text-foreground focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-email" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
            <Input
              id="c-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((d) => ({ ...d, email: e.target.value }))
              }
              className="h-12 rounded-2xl border-border bg-card px-4 text-foreground focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-phone" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
            <Input
              id="c-phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((d) => ({ ...d, phone: e.target.value }))
              }
              className="h-12 rounded-2xl border-border bg-card px-4 text-foreground focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-company" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Company</Label>
            <Input
              id="c-company"
              value={formData.companyName}
              onChange={(e) =>
                setFormData((d) => ({ ...d, companyName: e.target.value }))
              }
              className="h-12 rounded-2xl border-border bg-card px-4 text-foreground focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-title" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Role</Label>
            <Input
              id="c-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((d) => ({ ...d, title: e.target.value }))
              }
              className="h-12 rounded-2xl border-border bg-card px-4 text-foreground focus:ring-primary"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-notes" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes & Details</Label>
          <Textarea
            id="c-notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((d) => ({ ...d, notes: e.target.value }))
            }
            className="rounded-[20px] border-border bg-card px-4 py-3 text-foreground focus:ring-primary"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" className="h-12 rounded-2xl px-6 text-muted-foreground hover:text-foreground" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20">
            {isPending ? "Adding..." : "Add Contact"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
