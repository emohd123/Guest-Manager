"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Save,
  Trash2,
  Mail,
  Phone,
  Building2,
  User,
  Tag,
  Calendar,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = use(params);
  const router = useRouter();
  const {
    data: contact,
    isLoading,
    refetch,
  } = trpc.contacts.get.useQuery({ id: contactId });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    title: "",
    contactType: "",
    notes: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [prevContactId, setPrevContactId] = useState<string | null>(null);

  if (contact && contact.id !== prevContactId) {
    setPrevContactId(contact.id);
    setFormData({
      firstName: contact.firstName ?? "",
      lastName: contact.lastName ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      companyName: contact.companyName ?? "",
      title: contact.title ?? "",
      contactType: contact.contactType ?? "",
      notes: contact.notes ?? "",
      tags: contact.tags ?? [],
    });
  }

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated");
      setIsEditing(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteContact = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted");
      router.push("/dashboard/contacts");
    },
  });

  const handleSave = () => {
    updateContact.mutate({
      id: contactId,
      firstName: formData.firstName,
      lastName: formData.lastName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      companyName: formData.companyName || undefined,
      title: formData.title || undefined,
      contactType: formData.contactType || undefined,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((d) => ({ ...d, tags: [...d.tags, tag] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">Contact not found</h2>
        <Link href="/dashboard/contacts">
          <Button variant="outline" className="mt-4">
            Back to Contacts
          </Button>
        </Link>
      </div>
    );
  }

  const initials = `${contact.firstName?.[0] ?? ""}${contact.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contacts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-xl font-bold">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {contact.title && <span>{contact.title}</span>}
              {contact.title && contact.companyName && <span>at</span>}
              {contact.companyName && <span>{contact.companyName}</span>}
              {!contact.title && !contact.companyName && (
                <span>Added {format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data
                  if (contact) {
                    setFormData({
                      firstName: contact.firstName ?? "",
                      lastName: contact.lastName ?? "",
                      email: contact.email ?? "",
                      phone: contact.phone ?? "",
                      companyName: contact.companyName ?? "",
                      title: contact.title ?? "",
                      contactType: contact.contactType ?? "",
                      notes: contact.notes ?? "",
                      tags: contact.tags ?? [],
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateContact.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateContact.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update contact details below."
                  : "Personal and professional details."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((d) => ({
                            ...d,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((d) => ({
                            ...d,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData((d) => ({
                            ...d,
                            companyName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((d) => ({ ...d, title: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactType">Contact Type</Label>
                    <Input
                      id="contactType"
                      placeholder="e.g. VIP, Sponsor, Media, Speaker"
                      value={formData.contactType}
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          contactType: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, notes: e.target.value }))
                      }
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={contact.email}
                    />
                    <InfoRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={contact.phone}
                    />
                    <InfoRow
                      icon={<Building2 className="h-4 w-4" />}
                      label="Company"
                      value={contact.companyName}
                    />
                    <InfoRow
                      icon={<User className="h-4 w-4" />}
                      label="Job Title"
                      value={contact.title}
                    />
                  </div>
                  {contact.contactType && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="capitalize">
                        {contact.contactType}
                      </Badge>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="pt-2">
                      <Separator className="mb-4" />
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {contact.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Organize contacts with tags for easy filtering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? formData.tags : contact.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    {isEditing && (
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        &times;
                      </button>
                    )}
                  </Badge>
                ))}
                {(isEditing ? formData.tags : contact.tags ?? []).length ===
                  0 && (
                  <p className="text-sm text-muted-foreground">
                    No tags added yet.
                  </p>
                )}
              </div>
              {isEditing && (
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline" className="capitalize">
                  {contact.source ?? "manual"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {format(new Date(contact.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>
                  {format(new Date(contact.updatedAt), "MMM d, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Contact
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{" "}
                      <strong>
                        {contact.firstName} {contact.lastName}
                      </strong>
                      ? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        deleteContact.mutate({ id: contactId })
                      }
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value ?? "Not provided"}</p>
      </div>
    </div>
  );
}
