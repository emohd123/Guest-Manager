"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, MessageSquare, Send, Clock, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
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
    <div className="bg-[#080911] text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(37,99,235,0.10),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            Get in Touch
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl uppercase leading-none">
            Chat With{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              An Expert
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/60 leading-relaxed font-medium">
            Have questions about iTicket? Our team is here to help you find
            the right solution for your events.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-[#0c0e17] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Send us a message</h2>
                  <p className="text-sm text-white/50">We&apos;ll get back to you within 24 hours.</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/70 text-xs font-bold uppercase tracking-wider">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70 text-xs font-bold uppercase tracking-wider">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white/70 text-xs font-bold uppercase tracking-wider">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Acme Events Inc."
                    value={formData.company}
                    onChange={(e) => setFormData((d) => ({ ...d, company: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white/70 text-xs font-bold uppercase tracking-wider">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your event management needs..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 rounded-xl resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-white border-0 font-bold rounded-xl py-6"
                  disabled={sending}
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-[#0c0e17] p-6">
              <div className="space-y-5">
                {[
                  { icon: Mail, label: "Email", value: "info@onestonead.com", color: "blue" },
                  { icon: Phone, label: "Phone", value: "+973-33382466", color: "purple" },
                  { icon: MapPin, label: "Office", value: "Bahrain, Seef Area", color: "pink" },
                  { icon: Clock, label: "Response Time", value: "Within 24 hours", color: "blue" },
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
                      <p className="font-bold text-white text-sm">{item.label}</p>
                      <p className="text-sm text-white/50 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-white">Enterprise Sales</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                Managing 10,000+ guests per event? Let&apos;s build a custom
                solution for your organization.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-4 w-full border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-white rounded-xl font-bold"
              >
                <Link href="/pricing">View Enterprise Plan <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
