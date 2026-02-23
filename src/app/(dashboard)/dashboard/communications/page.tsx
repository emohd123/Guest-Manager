"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Ticket,
  UserPlus,
  Bell,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

const campaignTemplates = [
  { id: "ticket-delivery", name: "Ticket Delivery", description: "Send tickets to confirmed guests", icon: Ticket, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50" },
  { id: "confirmation", name: "Registration Confirmation", description: "Confirm registration and share event details", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/50" },
  { id: "reminder", name: "Event Reminder", description: "Remind guests about an upcoming event", icon: Bell, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/50" },
  { id: "invitation", name: "Event Invitation", description: "Invite contacts to register for your event", icon: UserPlus, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50" },
  { id: "announcement", name: "Announcement", description: "Send updates to attendees", icon: Megaphone, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/50" },
  { id: "custom", name: "Custom Email", description: "Create a fully custom email from scratch", icon: Mail, color: "text-primary", bg: "bg-primary/10" },
];

export default function CommunicationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    eventId: "",
    recipients: "all",
    body: "",
  });

  const { data: eventsData } = trpc.events.list.useQuery({ limit: 100, offset: 0 });
  const events = eventsData?.events ?? [];

  function handleTemplateSelect(templateId: string) {
    const template = campaignTemplates.find((t) => t.id === templateId);
    setSelectedTemplate(templateId);
    setCampaignForm((f) => ({
      ...f,
      subject: template?.name ?? "",
      body: "",
    }));
  }

  function handleClose(open: boolean) {
    setCreateOpen(open);
    if (!open) {
      setSelectedTemplate(null);
      setCampaignForm({ name: "", subject: "", eventId: "", recipients: "all", body: "" });
    }
  }

  function handleSendCampaign() {
    toast.success("Campaign saved! (Email delivery via Resend coming soon)");
    handleClose(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communications</h1>
          <p className="text-muted-foreground">Send emails, ticket deliveries, and reminders to your guests.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={handleClose}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>{selectedTemplate ? "Configure your email campaign" : "Choose a template to get started"}</DialogDescription>
            </DialogHeader>
            {!selectedTemplate ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {campaignTemplates.map((t) => (
                  <button key={t.id} className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50" onClick={() => setSelectedTemplate(t.id)}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.bg}`}><t.icon className={`h-5 w-5 ${t.color}`} /></div>
                    <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.description}</p></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="campaign-name">Campaign Name</Label><Input id="campaign-name" placeholder="e.g., Gala 2025 - Ticket Delivery" /></div>
                <div className="space-y-2"><Label htmlFor="subject">Email Subject</Label><Input id="subject" placeholder="Your tickets for Annual Gala" /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Event</Label><Select><SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger><SelectContent>
                        {events.length === 0 ? (
                          <SelectItem value="none" disabled>No events yet</SelectItem>
                        ) : (
                          events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                          ))
                        )}
                      </SelectContent></Select></div>
                  <div className="space-y-2"><Label>Recipients</Label><Select><SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger><SelectContent><SelectItem value="all">All guests</SelectItem><SelectItem value="confirmed">Confirmed only</SelectItem><SelectItem value="not-checked-in">Not checked in</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="body">Email Body</Label><Textarea id="body" placeholder="Write your email content..." rows={6} /></div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Back</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2"><Clock className="h-4 w-4" /> Schedule</Button>
                    <Button className="gap-2"><Send className="h-4 w-4" /> Send Now</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Sent", value: "0", icon: Send, color: "text-blue-600" },
          { label: "Delivered", value: "0", icon: CheckCircle, color: "text-green-600" },
          { label: "Opened", value: "0%", icon: Mail, color: "text-purple-600" },
          { label: "Failed", value: "0", icon: AlertCircle, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Campaigns</CardTitle><CardDescription>Your email campaigns and their performance</CardDescription></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Mail className="h-10 w-10 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Create your first email campaign to send tickets, confirmations, or announcements.</p>
                <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create Campaign</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations">
          <Card>
            <CardHeader><CardTitle className="text-base">Email Automations</CardTitle><CardDescription>Set up automated emails triggered by guest actions</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Registration Confirmation", trigger: "When a guest registers" },
                  { name: "Ticket Delivery", trigger: "When an order is confirmed" },
                  { name: "Event Reminder (24h)", trigger: "24 hours before event" },
                  { name: "Post-Event Thank You", trigger: "After event ends" },
                ].map((a) => (
                  <div key={a.name} className="flex items-center justify-between rounded-lg border p-4">
                    <div><p className="font-medium">{a.name}</p><p className="text-xs text-muted-foreground">Trigger: {a.trigger}</p></div>
                    <Badge variant="secondary" className="text-muted-foreground">Inactive</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaignTemplates.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-6">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${t.bg}`}><t.icon className={`h-6 w-6 ${t.color}`} /></div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  <Button variant="outline" size="sm" className="mt-4">Use Template</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
