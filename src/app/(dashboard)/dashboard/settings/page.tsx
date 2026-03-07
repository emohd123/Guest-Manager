"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CreditCard,
  Users,
  Key,
  Plus,
  Mail,
  Check,
  Zap,
  Camera,
  Trash2,
  ExternalLink,
  ChevronRight,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function SettingsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20 px-2"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Settings</h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">
          Manage your workspace, billing, team, and integrations
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-10">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto w-fit overflow-x-auto flex-nowrap">
          <TabsTrigger value="account" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic flex gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic flex gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic flex gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic flex gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="account" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <AccountSettings />
            </motion.div>
          </TabsContent>
          <TabsContent value="billing" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <BillingSettings />
            </motion.div>
          </TabsContent>
          <TabsContent value="team" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <TeamSettings />
            </motion.div>
          </TabsContent>
          <TabsContent value="api" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <ApiSettings />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
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
      toast.success("Organization saved");
      utils.settings.getCompany.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUser = trpc.settings.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Identity updated");
      utils.settings.getUser.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Company Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[40px] bg-white/5 border border-white/10 p-10 relative overflow-hidden group"
      >
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white italic leading-none mb-2">Organization</h3>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Organization profile</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
               <Building2 className="h-7 w-7" />
            </div>
          </div>

          <div className="flex items-center gap-8 py-4">
             <div className="relative group/avatar">
               <div className="h-24 w-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover/avatar:bg-white/8 transition-all">
                  <Building2 className="h-10 w-10" />
               </div>
               <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                  <Camera className="h-5 w-5" />
               </button>
             </div>
             <div className="space-y-1">
               <p className="text-sm font-black text-white italic">Asset Identity</p>
               <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">SVG, PNG or WebP · Max 4MB</p>
             </div>
          </div>

          {companyLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-14 w-full rounded-2xl bg-white/5" />
              <Skeleton className="h-14 w-full rounded-2xl bg-white/5" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Organization Name</Label>
                <Input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm(f => ({ ...f, name: e.target.value }))}
                  className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 focus:border-primary transition-all"
                  placeholder="ACME CORP"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Workspace Slug</Label>
                <div className="relative">
                  <Input
                    value={companyForm.slug}
                    onChange={(e) => setCompanyForm(f => ({ ...f, slug: e.target.value }))}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 pl-14 focus:border-primary transition-all"
                    placeholder="acme-hq"
                  />
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Timezone</Label>
                <Select
                  value={companyForm.timezone}
                  onValueChange={(v) => setCompanyForm(f => ({ ...f, timezone: v }))}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 focus:border-primary transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1C30] border-white/10 text-white">
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
              <Button
                onClick={() => updateCompany.mutate(companyForm)}
                disabled={updateCompany.isPending}
                className="h-14 w-full rounded-2xl bg-primary text-white font-black italic uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {updateCompany.isPending ? "Saving..." : "Save Organization"}
              </Button>
            </div>
          )}
        </div>
        <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px]" />
      </motion.div>

      {/* Identity & Danger Section */}
      <div className="space-y-8">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="rounded-[40px] bg-white/5 border border-white/10 p-10 relative overflow-hidden"
        >
          <div className="relative z-10 space-y-8">
            <div>
              <h3 className="text-2xl font-black text-white italic leading-none mb-2">Operator</h3>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Profile and access</p>
            </div>

            {userLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-14 w-full rounded-2xl bg-white/5" />
                <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</Label>
                  <Input
                    value={userForm.name}
                    onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 focus:border-primary transition-all"
                    placeholder="OPERATOR NAME"
                  />
                </div>
                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Role</span>
                    <Badge className="bg-primary/20 text-primary border-none font-black italic uppercase text-[10px] tracking-widest px-3 py-1">
                      {user?.role ?? "OWNER"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Email</p>
                      <p className="text-sm font-bold text-white/60">{user?.email}</p>
                    </div>
                    <Button variant="ghost" className="h-10 px-4 rounded-xl text-white/20 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest">
                      Edit
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => updateUser.mutate(userForm)}
                  disabled={updateUser.isPending}
                  className="h-14 w-full rounded-2xl bg-white/10 text-white font-black italic uppercase tracking-widest hover:bg-white/15 transition-all"
                >
                  {updateUser.isPending ? "Updating..." : "Save Profile"}
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="rounded-[40px] bg-red-500/5 border border-red-500/20 p-10 relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic leading-none mb-1 uppercase tracking-tighter">Danger Zone</h3>
                <p className="text-red-500/40 text-[10px] font-bold uppercase tracking-widest">Irreversible deletion</p>
              </div>
            </div>
            
            <p className="text-white/30 text-xs leading-relaxed max-w-[300px]">
              Purge all data clusters and terminate account access permanently. This cannot be undone.
            </p>

            <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl h-12 w-full transition-all">
              Delete Workspace
            </Button>
          </div>
        </motion.div>
      </div>
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
    <div className="space-y-12">
      {/* Current Usage Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[40px] bg-white/5 border border-white/10 p-10 relative overflow-hidden"
      >
        <div className="relative z-10 grid gap-10 lg:grid-cols-2 items-center">
           <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-[24px] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40">
                   <Zap className="h-8 w-8" />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">FREE TIER</h3>
                      <Badge className="bg-green-500/20 text-green-400 border-none font-black text-[9px] uppercase tracking-[0.2em] px-3">ACTIVE</Badge>
                   </div>
                   <p className="text-white/30 font-bold uppercase tracking-widest text-[10px]">{company?.name ?? "WORKSPACE"}</p>
                </div>
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                  <span className="text-white/40">Usage</span>
                  <span className="text-white italic">{checkInsUsed} / {creditLimit} CREDITS</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(checkInsUsed / creditLimit) * 100}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
             </div>
           </div>

           <div className="bg-white/3 rounded-[32px] border border-white/5 p-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Available Balance</p>
                <h2 className="text-5xl font-black text-white italic tracking-tighter">{creditsLeft}</h2>
              </div>
              <Button className="h-16 px-8 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black italic uppercase tracking-widest transition-all">
                Buy Credits
              </Button>
           </div>
        </div>
        <div className="absolute -left-20 -top-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px]" />
      </motion.div>

      {/* Pricing Grid */}
      <div>
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h3 className="text-2xl font-black text-white italic leading-none mb-2">Plans</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Choose the right plan for your team</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "rounded-[32px] p-8 border relative flex flex-col transition-all group hover:-translate-y-2",
                plan.popular 
                  ? "bg-linear-to-br from-primary/20 to-primary/5 border-primary shadow-2xl shadow-primary/10" 
                  : plan.current 
                    ? "bg-white/5 border-primary/20" 
                    : "bg-white/5 border-white/10"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full italic shadow-xl">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mb-1">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white italic tracking-tighter">${plan.price}</span>
                    <span className="text-[10px] font-bold text-white/20 uppercase">/month</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Monthly Load</p>
                   <p className="text-sm font-black text-white italic">{plan.credits.toLocaleString()} Credits</p>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-xs font-bold text-white/50">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                         <Check className="h-2.5 w-2.5 text-primary" strokeWidth={4} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Button 
                  disabled={plan.current}
                  className={cn(
                    "h-14 w-full rounded-2xl font-black italic uppercase tracking-widest transition-all",
                    plan.current 
                      ? "bg-white/5 text-white/20 border border-white/10" 
                      : plan.popular 
                        ? "bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.02]" 
                        : "bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  {plan.current ? "ACTIVE" : "UPGRADE"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamSettings() {
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: members, isLoading } = trpc.settings.getTeamMembers.useQuery();

  return (
    <div className="space-y-12">
      {/* Invite Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[40px] bg-white/5 border border-white/10 p-10 relative overflow-hidden"
      >
        <div className="relative z-10 space-y-8">
          <div>
            <h3 className="text-2xl font-black text-white italic leading-none mb-2">Invite Team Members</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Invite teammates to collaborate</p>
          </div>

          <div className="grid gap-4 md:flex items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Coordinates</Label>
              <Input
                type="email"
                placeholder="OPERATOR@CORE.SYSTEM"
                className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 focus:border-primary transition-all"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[180px] space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Assigned Role</Label>
               <Select defaultValue="manager">
                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1C30] border-white/10 text-white">
                  <SelectItem value="admin">ADMINISTRATOR</SelectItem>
                  <SelectItem value="manager">MANAGER</SelectItem>
                  <SelectItem value="staff">TECHNICAL STAFF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="h-14 px-8 rounded-2xl bg-primary text-white font-black italic uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex gap-3"
              onClick={() => {
                if (inviteEmail) {
                  toast.success(`Invitation transmitted to ${inviteEmail}`);
                  setInviteEmail("");
                }
              }}
            >
              <Mail className="h-5 w-5" />
              Transmit
            </Button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px]" />
      </motion.div>

      {/* Team Roster */}
      <div>
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h3 className="text-2xl font-black text-white italic leading-none mb-2">Personnel Roster</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Active team members</p>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[32px] bg-white/5" />)
          ) : (
            (members ?? []).map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center justify-between rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/8 p-6 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black italic">
                      {(member.name ?? member.email)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white italic tracking-tighter leading-none mb-1">
                      {member.name ?? "UNKNOWN OPERATOR"}
                    </h4>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right hidden sm:block">
                     <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Authorization</p>
                     <Badge className="bg-white/10 text-white/60 border-none font-black text-[9px] uppercase tracking-widest px-3">
                        {member.role}
                     </Badge>
                   </div>
                   <Button variant="ghost" className="h-12 w-12 rounded-2xl p-0 text-white/10 hover:text-white hover:bg-white/5">
                      <ChevronRight className="h-6 w-6" />
                   </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ApiSettings() {
  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* API Infrastructure */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="rounded-[40px] bg-white/5 border border-white/10 p-10 relative overflow-hidden h-fit"
        >
          <div className="relative z-10 space-y-10">
            <div>
              <h3 className="text-2xl font-black text-white italic leading-none mb-2">API Keys</h3>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Manage integrations and secure access</p>
            </div>

            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
               <div className="h-24 w-24 rounded-[40px] bg-primary/5 flex items-center justify-center text-primary/20 rotate-12">
                  <Key className="h-12 w-12" />
               </div>
               <div className="space-y-2">
                 <p className="text-white/60 font-black italic text-lg leading-none">NO ACTIVE INTEGRATIONS</p>
                 <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Generate persistent authorization keys</p>
               </div>
            </div>

            <Button disabled className="h-16 w-full rounded-3xl bg-white/5 border border-white/10 text-white/20 font-black italic uppercase tracking-widest">
              LOCKED · STORAGE REQUIRED
            </Button>
          </div>
        </motion.div>

        {/* Webhooks */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="rounded-[40px] bg-[#1A1C30] border border-white/10 p-10 relative overflow-hidden"
        >
          <div className="relative z-10 space-y-10">
            <div>
              <h3 className="text-2xl font-black text-white italic leading-none mb-2">Webhooks</h3>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Send event updates to external systems</p>
            </div>

            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl space-y-6">
               <Zap className="h-10 w-10 text-white/5" />
               <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Disconnected</p>
            </div>

            <Button disabled className="h-16 w-full rounded-3xl bg-primary text-white font-black italic uppercase tracking-widest opacity-20 cursor-not-allowed">
               <Plus className="h-5 w-5 mr-3" />
               Add Endpoint
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Docs Grid */}
      <div>
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h3 className="text-2xl font-black text-white italic leading-none mb-2">Documentation</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Guides for setup and integrations</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Getting Started",
              desc: "Authentication and setup basics",
              icon: Zap
            },
            {
              title: "Events API",
              desc: "Create, update, and manage events",
              icon: Building2
            },
            {
              title: "Guest Data",
              desc: "Guests, check-in activity, and reporting",
              icon: Users
            },
          ].map((doc, i) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-[32px] bg-white/5 border border-white/10 p-8 hover:bg-white/8 transition-all cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <doc.icon className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-black text-white italic mb-2 tracking-tighter uppercase">{doc.title}</h4>
              <p className="text-xs font-bold text-white/30 uppercase tracking-tighter leading-relaxed mb-6">
                {doc.desc}
              </p>
              <div className="flex items-center gap-2 text-primary font-black italic text-[10px] uppercase tracking-widest">
                 View Docs
                 <ExternalLink className="h-3 w-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

