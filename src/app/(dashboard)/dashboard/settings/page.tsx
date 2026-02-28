"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CreditCard,
  Users,
  Key,
  Shield,
  Plus,
  Mail,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, billing, team, and integrations.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="account" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>
        <TabsContent value="api">
          <ApiSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountSettings() {
  const utils = trpc.useUtils();
  const { data: company, isLoading: companyLoading } = trpc.settings.getCompany.useQuery();
  const { data: user, isLoading: userLoading } = trpc.settings.getUser.useQuery();

  const [companyForm, setCompanyForm] = useState({
    name: "",
    slug: "",
    timezone: "America/Los_Angeles",
  });

  const [userForm, setUserForm] = useState({
    name: "",
  });

  const [prevCompanyId, setPrevCompanyId] = useState<string | null>(null);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  if (company && company.id !== prevCompanyId) {
    setPrevCompanyId(company.id);
    setCompanyForm({
      name: company.name ?? "",
      slug: company.slug ?? "",
      timezone: company.timezone ?? "America/Los_Angeles",
    });
  }

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setUserForm({ name: user.name ?? "" });
  }

  const updateCompany = trpc.settings.updateCompany.useMutation({
    onSuccess: () => {
      toast.success("Company settings saved");
      utils.settings.getCompany.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUser = trpc.settings.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.settings.getUser.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            Your company information and branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed bg-muted text-muted-foreground">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <Button variant="outline" size="sm" disabled>
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 2MB. Recommended 200x200px.
              </p>
            </div>
          </div>
          <Separator />
          {companyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyForm.name}
                    onChange={(e) =>
                      setCompanyForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Acme Events Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Company Slug</Label>
                  <Input
                    id="slug"
                    value={companyForm.slug}
                    onChange={(e) =>
                      setCompanyForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="acme-events"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in public event URLs
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultTimezone">Default Timezone</Label>
                  <Select
                    value={companyForm.timezone}
                    onValueChange={(v) =>
                      setCompanyForm((f) => ({ ...f, timezone: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => updateCompany.mutate(companyForm)}
                  disabled={updateCompany.isPending}
                >
                  {updateCompany.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div>
                  <Badge variant="secondary" className="capitalize">
                    {user?.role ?? "owner"}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => updateUser.mutate(userForm)}
                  disabled={updateUser.isPending}
                >
                  {updateUser.isPending ? "Saving..." : "Update Profile"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingSettings() {
  const { data: company } = trpc.settings.getCompany.useQuery();
  const { data: eventStats } = trpc.events.stats.useQuery();

  const checkInsUsed = eventStats?.totalCheckIns ?? 0;
  const creditLimit = 50;
  const creditsLeft = Math.max(0, creditLimit - checkInsUsed);

  const plans = [
    {
      name: "Free",
      price: 0,
      credits: 50,
      current: true,
      features: [
        "50 check-in credits",
        "1 event",
        "Basic check-in",
        "CSV export",
      ],
    },
    {
      name: "Planner",
      price: 39,
      credits: 500,
      current: false,
      features: [
        "500 check-in credits",
        "Unlimited events",
        "Guest import",
        "Real-time sync",
        "Custom branding",
      ],
    },
    {
      name: "Professional",
      price: 79,
      credits: 2000,
      current: false,
      popular: true,
      features: [
        "2,000 check-in credits",
        "Unlimited events",
        "Ticket studio",
        "Online registration",
        "QR/barcode scanning",
        "Priority support",
      ],
    },
    {
      name: "Concierge",
      price: 199,
      credits: 10000,
      current: false,
      features: [
        "10,000 check-in credits",
        "Unlimited everything",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
        "White-label options",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">Free Plan</p>
                  <Badge>Current</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {creditLimit} credits / month ·{" "}
                  {company?.name ?? "Your Company"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="font-medium">Credit Balance</p>
              <p className="text-sm text-muted-foreground">
                {checkInsUsed} of {creditLimit} used this month
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {creditsLeft}
                </p>
                <p className="text-xs text-muted-foreground">credits left</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Buy Credits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Available Plans</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.popular
                  ? "border-primary shadow-md"
                  : plan.current
                  ? "border-green-500"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge className="bg-primary">Popular</Badge>
                  )}
                  {plan.current && (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-600"
                    >
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.credits.toLocaleString()} credits/month
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={
                    plan.current
                      ? "outline"
                      : plan.popular
                      ? "default"
                      : "outline"
                  }
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            Download past invoices and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No invoices yet. Invoices will appear here once you upgrade to a
            paid plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamSettings() {
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: members, isLoading } = trpc.settings.getTeamMembers.useQuery();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Members</CardTitle>
          <CardDescription>
            Add colleagues to help manage your events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Select defaultValue="manager">
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="gap-2"
              onClick={() => {
                if (inviteEmail) {
                  toast.success(`Invitation sent to ${inviteEmail}`);
                  setInviteEmail("");
                }
              }}
            >
              <Mail className="h-4 w-4" /> Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            People with access to your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(members ?? []).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-sm font-bold">
                        {(member.name ?? member.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.name ?? member.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Understand what each role can do.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                role: "Admin",
                icon: Shield,
                permissions: [
                  "Full account access",
                  "Manage billing",
                  "Invite/remove members",
                  "All event operations",
                ],
              },
              {
                role: "Manager",
                icon: Users,
                permissions: [
                  "Create/edit events",
                  "Manage guests",
                  "Run check-in",
                  "View reports",
                ],
              },
              {
                role: "Staff",
                icon: Check,
                permissions: [
                  "Check-in guests",
                  "View guest lists",
                  "Scan tickets",
                  "View assigned events",
                ],
              },
            ].map(({ role, icon: Icon, permissions }) => (
              <div key={role} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="font-medium">{role}</p>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {permissions.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for programmatic access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Key className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No API keys have been generated for this workspace.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              API key lifecycle management is disabled until secure key storage is configured.
            </p>
          </div>
          <Button variant="outline" className="gap-2" disabled>
            <Plus className="h-4 w-4" /> Create New Key
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Receive real-time notifications for events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Key className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No webhooks configured. Add a webhook endpoint to receive
              real-time event notifications.
            </p>
            <Button variant="outline" className="mt-4 gap-2" disabled>
              <Plus className="h-4 w-4" /> Add Webhook
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Learn how to integrate with the GuestManager API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Getting Started",
                desc: "Authentication, rate limits, and basic usage",
              },
              {
                title: "Events API",
                desc: "Create, read, update, and delete events",
              },
              {
                title: "Guests API",
                desc: "Manage guest lists, check-ins, and imports",
              },
            ].map((doc) => (
              <div
                key={doc.title}
                className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <p className="font-medium">{doc.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {doc.desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
