"use client";

import { useState } from "react";
import { Building2, Edit3, Plus, Save, Users, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CustomerForm = {
  legalName: string;
  displayName: string;
  email: string;
  mobile: string;
  country: string;
  notes: string;
};

const emptyForm: CustomerForm = { legalName: "", displayName: "", email: "", mobile: "", country: "", notes: "" };

export default function CustomersPage() {
  const utils = trpc.useUtils();
  const customers = trpc.customerCompanies.list.useQuery();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const create = trpc.customerCompanies.create.useMutation({
    onSuccess: () => { toast.success("Customer added"); setForm(emptyForm); void utils.customerCompanies.list.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.customerCompanies.update.useMutation({
    onSuccess: () => { toast.success("Customer updated"); setEditingId(null); setForm(emptyForm); void utils.customerCompanies.list.invalidate(); },
    onError: (error) => toast.error(error.message),
  });

  const submit = () => {
    if (!form.legalName.trim() || !form.email.trim()) {
      toast.error("Legal name and email are required");
      return;
    }
    const payload = {
      legalName: form.legalName.trim(), displayName: form.displayName.trim() || null,
      email: form.email.trim(), mobile: form.mobile.trim() || null,
      country: form.country.trim() || null, notes: form.notes.trim() || null,
    };
    if (editingId) update.mutate({ id: editingId, ...payload });
    else create.mutate({ ...payload, vatNumber: null, website: null, address: null });
  };

  const startEdit = (customer: NonNullable<typeof customers.data>[number]) => {
    setEditingId(customer.id);
    setForm({ legalName: customer.legalName ?? "", displayName: customer.displayName ?? "", email: customer.email ?? "", mobile: customer.mobile ?? "", country: customer.country ?? "", notes: customer.notes ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Customer management</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-4xl font-black italic tracking-tighter">Customers</h1><p className="mt-2 text-sm text-muted-foreground">Add and maintain customer companies independently from event creation.</p></div>
          <Button onClick={() => { setEditingId(null); setForm(emptyForm); }}><Plus className="mr-2 h-4 w-4" /> Add customer</Button>
        </div>
      </div>

      <section className="theme-panel p-6">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div><h2 className="text-xl font-black">{editingId ? "Edit customer" : "New customer"}</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          {([ ["legalName", "Legal name *"], ["displayName", "Display name"], ["email", "Email *"], ["mobile", "Mobile"], ["country", "Country"] ] as const).map(([key, label]) => (
            <div key={key} className="space-y-2"><Label>{label}</Label><Input type={key === "email" ? "email" : "text"} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></div>
          ))}
          <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-3">{editingId ? <Button variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm); }}><X className="mr-2 h-4 w-4" /> Cancel</Button> : null}<Button onClick={submit} disabled={create.isPending || update.isPending}><Save className="mr-2 h-4 w-4" /> {editingId ? "Save changes" : "Create customer"}</Button></div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">Customer accounts</h2><span className="text-sm text-muted-foreground">{customers.data?.length ?? 0}</span></div>
        {customers.isLoading ? <div className="theme-panel p-8 text-muted-foreground">Loading customers…</div> : null}
        {!customers.isLoading && !customers.data?.length ? <div className="theme-panel p-8 text-muted-foreground">No customers yet. Add your first customer above.</div> : null}
        {customers.data?.map((customer) => <div key={customer.id} className="theme-panel flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><p className="truncate font-black">{customer.displayName || customer.legalName}</p><p className="truncate text-sm text-muted-foreground">{customer.email}{customer.mobile ? ` · ${customer.mobile}` : ""}</p></div><Button variant="outline" onClick={() => startEdit(customer)}><Edit3 className="mr-2 h-4 w-4" /> Edit</Button></div>)}
      </section>
    </div>
  );
}

