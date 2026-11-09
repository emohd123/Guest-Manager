"use client";

import { usePublicCopy } from "@/lib/use-public-copy";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, MessageSquare, Send, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const tr = usePublicCopy();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", company: "", message: "" });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="bg-[#f6f7fb] text-slate-900 min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(37,99,235,0.10),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
             {tr("Get in Touch")} </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 sm:text-6xl uppercase leading-none">
             {tr("Chat With")}{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
               {tr("An Expert")} </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed font-medium">
             {tr("Have questions about iTicket? Our team is here to help you find the right solution for your events.")} </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{tr("Send us a message")}</h2>
                  <p className="text-sm text-slate-600">{tr("We'll get back to you within 24 hours.")}</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-600 text-xs font-bold uppercase tracking-wider">{tr("Full Name *")}</Label>
                    <Input
                      id="name"
                      placeholder={tr("John Doe")}
                      value={formData.name}
                      onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                      required
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-purple-500/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600 text-xs font-bold uppercase tracking-wider">{tr("Email Address *")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={tr("john@company.com")}
                      value={formData.email}
                      onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                      required
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-purple-500/50 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-600 text-xs font-bold uppercase tracking-wider">{tr("Company Name")}</Label>
                  <Input
                    id="company"
                    placeholder={tr("Acme Events Inc.")}
                    value={formData.company}
                    onChange={(e) => setFormData((d) => ({ ...d, company: e.target.value }))}
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-purple-500/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-600 text-xs font-bold uppercase tracking-wider">{tr("Message *")}</Label>
                  <Textarea
                    id="message"
                    placeholder={tr("Tell us about your event management needs...")}
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                    required
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-purple-500/50 rounded-xl resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-slate-900 border-0 font-bold rounded-xl py-6"
                  disabled={sending}
                >
                  <Send className="h-4 w-4" />
                  {sending ? tr("Sending...") : tr("Send Message")}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="space-y-5">
                {[
                  { icon: Mail, label: tr("Email"), value: "info@onestonead.com", color: "blue" },
                  { icon: Phone, label: tr("Phone"), value: "+973-33382466", color: "purple" },
                  { icon: MapPin, label: tr("Office"), value: tr("Bahrain, Seef Area"), color: "pink" },
                  { icon: Clock, label: tr("Response Time"), value: tr("Within 24 hours"), color: "blue" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      item.color === "blue" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                      item.color === "purple" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                      "bg-pink-500/10 border-pink-500/20 text-pink-400"
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
