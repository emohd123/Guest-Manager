import Link from "next/link";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "Use of the Service",
    body: "iTicket may be used by event organizers, venue teams, and authorized staff to manage registrations, guests, ticketing, attendee communications, and check-in operations. You are responsible for maintaining accurate account information and for ensuring that your team uses the platform lawfully and responsibly.",
  },
  {
    title: "Customer Responsibilities",
    body: "You are responsible for the content, attendee data, ticketing rules, pricing, communications, and operational decisions configured in your account. You must only collect and use attendee information when you have the right to do so and must comply with any laws, regulations, venue rules, or contractual obligations that apply to your events.",
  },
  {
    title: "Payments and Third-Party Services",
    body: "Payments, email delivery, authentication, hosting, and other platform functions may rely on third-party providers. iTicket is not responsible for outages, delays, or failures caused by those providers, but we will make commercially reasonable efforts to maintain reliable service.",
  },
  {
    title: "Availability and Changes",
    body: "We may improve, modify, or discontinue features from time to time. We aim to keep iTicket available and secure, but we do not guarantee uninterrupted or error-free service, especially during maintenance windows, network failures, or incidents outside our control.",
  },
  {
    title: "Liability",
    body: "To the maximum extent permitted by law, iTicket is provided on an as-available basis. We are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or event losses arising from use of the service.",
  },
];

export default async function TermsOfServicePage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const ar = (await searchParams).locale === "ar";
  const arabicSections = [{"title":"استخدام الخدمة","body":"يمكن لمنظمي الفعاليات وفرق المواقع والموظفين المعتمدين استخدام iTicket لإدارة التسجيلات والضيوف والتذاكر والتواصل مع الحضور وتسجيل الدخول. أنت مسؤول عن دقة بيانات حسابك وضمان استخدام فريقك للمنصة بصورة قانونية ومسؤولة."},{"title":"مسؤوليات العميل","body":"أنت مسؤول عن المحتوى وبيانات الحضور وقواعد التذاكر والأسعار والتواصل والقرارات التشغيلية التي تضبطها في حسابك. يجب ألا تجمع معلومات الحضور أو تستخدمها إلا إذا كان لك الحق في ذلك، وعليك الالتزام بالقوانين واللوائح وقواعد المواقع والالتزامات التعاقدية المنطبقة على فعالياتك."},{"title":"المدفوعات وخدمات الأطراف الأخرى","body":"قد تعتمد المدفوعات وتسليم البريد الإلكتروني والمصادقة والاستضافة وغيرها من وظائف المنصة على مزودي خدمات خارجيين. لا تتحمل iTicket مسؤولية الانقطاعات أو التأخيرات أو الأعطال الناتجة عن هؤلاء المزودين، وسنبذل جهوداً معقولة تجارياً للحفاظ على موثوقية الخدمة."},{"title":"التوافر والتغييرات","body":"قد نحسن الميزات أو نعدلها أو نوقفها من وقت لآخر. نسعى إلى إبقاء iTicket متاحاً وآمناً، لكننا لا نضمن خدمة خالية من الانقطاع أو الأخطاء، خصوصاً أثناء الصيانة أو أعطال الشبكة أو الحوادث الخارجة عن سيطرتنا."},{"title":"المسؤولية","body":"تقدم iTicket على أساس التوافر وبالقدر الأقصى الذي يسمح به القانون. لا نتحمل مسؤولية الأضرار غير المباشرة أو العرضية أو الخاصة أو التبعية أو العقابية، أو خسارة الأرباح أو البيانات أو خسائر الفعاليات الناشئة عن استخدام الخدمة."}];
  const displayedSections = ar ? arabicSections : sections;
  return (
    <div className="bg-[#f6f7fb] text-slate-900 min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 backdrop-blur-md">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            {ar ? "المعلومات القانونية" : "Legal"}
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 sm:text-6xl uppercase leading-none">
            {ar ? "الشروط " : "Terms of "}
            <span className="bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              {ar ? "والأحكام" : "Service"}
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
            {ar ? "تنظم هذه الشروط الوصول إلى موقع iTicket ولوحة التحكم والتطبيقات المرتبطة به." : "These terms govern access to the iTicket website, dashboard, and companion mobile applications."}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="space-y-3 pb-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-slate-900">{ar ? "الاتفاقية" : "Agreement"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "بإنشاء حساب أو الوصول إلى لوحة التحكم أو استخدام تطبيق iTicket، فإنك توافق على هذه الشروط وعلى " : "By creating an account, accessing the dashboard, or using the iTicket mobile app, you agree to these terms and to our "}
              <Link href={`/privacy-policy?locale=${ar ? "ar" : "en"}`} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                {ar ? "سياسة الخصوصية" : "privacy policy"}
              </Link>{ar ? ". إذا كنت تستخدم الخدمة نيابة عن مؤسسة، فأنت تؤكد أن لديك صلاحية إلزامها بهذه الشروط." : ". If you are using the service on behalf of an organization, you confirm that you are authorized to bind that organization to these terms."}
            </p>
          </div>

          {displayedSections.map((section, i) => (
            <div key={section.title} className={`space-y-3 ${i < displayedSections.length - 1 ? "pb-6 border-b border-white/5" : ""}`}>
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              <p className="text-sm leading-7 text-slate-600">{section.body}</p>
            </div>
          ))}

          <div className="space-y-3 pt-2 pb-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-slate-900">{ar ? "إنهاء الخدمة" : "Termination"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "قد نعلق الوصول إلى iTicket أو ننهيه إذا استخدمت الحسابات بصورة غير قانونية أو مسيئة أو بما يهدد أمن المنصة أو سلامتها أو توافرها." : "We may suspend or terminate access to iTicket if accounts are used unlawfully, abusively, or in a way that threatens the security, integrity, or availability of the platform."}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">{ar ? "تواصل معنا" : "Contact"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "للإشعارات القانونية أو أسئلة الدعم أو المساعدة بشأن الحساب، تواصل عبر " : "For legal notices, support questions, or account assistance, contact "}
              <Link href="mailto:info@onestonead.com" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                info@onestonead.com
              </Link>
              {ar ? " أو استخدم " : " or use the "}
              <Link href={`/contact?locale=${ar ? "ar" : "en"}`} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                {ar ? "صفحة التواصل" : "contact page"}
              </Link>{" "}
              {ar ? "على موقع iTicket." : "on the iTicket website."}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">{ar ? "آخر تحديث: يونيو ٢٠٢٦ · iTicket، منصة ون ستون للإعلان" : "Last updated: June 2026 · iTicket, a OneStone Ads platform"}</p>
      </section>
    </div>
  );
}
