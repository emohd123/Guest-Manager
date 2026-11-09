"use client";

import type { ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { BilingualEventDetails, EventDetailKey } from "@/lib/event-details";

type Props = {
  errors?: Partial<Record<EventDetailKey, string>>;
  idPrefix: string;
} & ({ registerField: (key: EventDetailKey) => UseFormRegisterReturn } | {
  value: BilingualEventDetails;
  onChange: (key: EventDetailKey, value: string) => void;
});

const languages = [
  { language: "en", heading: "English details / التفاصيل الإنجليزية", fields: [
    { key: "title", label: "Event name (English)", placeholder: "Bahrain Summer Festival", max: 255 },
    { key: "shortDescription", label: "Short summary (English)", placeholder: "A short introduction for event listings", max: 500 },
    { key: "description", label: "Full description (English)", placeholder: "Describe the event, programme and what attendees should know", max: 20000 },
  ] },
  { language: "ar", heading: "Arabic details / التفاصيل العربية", fields: [
    { key: "titleAr", label: "اسم الفعالية بالعربية", placeholder: "مهرجان صيف البحرين", max: 255 },
    { key: "shortDescriptionAr", label: "الملخص بالعربية", placeholder: "مقدمة قصيرة تظهر في قوائم الفعاليات", max: 500 },
    { key: "descriptionAr", label: "الوصف الكامل بالعربية", placeholder: "وضح تفاصيل الفعالية والبرنامج والمعلومات المهمة للحضور", max: 20000 },
  ] },
] as const;

export function BilingualEventFields(props: Props) {
  return <div className="space-y-5">
    <p className="text-sm leading-6 text-muted-foreground">Complete all three fields in both languages. All fields marked * are required. Dates, times and capacity are shared between languages.</p>
    <div className="grid gap-6 md:grid-cols-2">
      {languages.map(({ language, heading, fields }) => <section key={language} dir={language === "ar" ? "rtl" : "ltr"} lang={language} className="min-w-0 space-y-5 rounded-2xl border border-border p-4 sm:p-5">
        <h3 className="text-sm font-black text-foreground">{heading}</h3>
        {fields.map(({ key, label, placeholder, max }) => {
          const id = `${props.idPrefix}-${key}`;
          const error = props.errors?.[key];
          const bindings = "registerField" in props ? props.registerField(key) : {
            value: props.value[key],
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.onChange(key, event.target.value),
          };
          return <div key={key} className="space-y-2">
            <Label htmlFor={id}>{label} <span aria-hidden="true">*</span></Label>
            {key === "description" || key === "descriptionAr"
              ? <Textarea {...bindings} id={id} required maxLength={max} placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="theme-textarea min-h-[180px]" />
              : <Input {...bindings} id={id} required maxLength={max} placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="theme-input h-12" />}
            {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>;
        })}
      </section>)}
    </div>
  </div>;
}
