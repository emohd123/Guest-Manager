import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";

const sections = [
  {
    title: "What We Collect",
    body: "iTicket processes the account, attendee, ticketing, device, and communication details that event organizers choose to store in the platform. This can include names, email addresses, phone numbers, ticket records, event metadata, and operational logs needed to run check-in, registration, and guest management workflows.",
  },
  {
    title: "How We Use Information",
    body: "We use this information to operate the iTicket website and mobile app, authenticate users, process ticketing and registration actions, send transactional communications, support event operations, improve reliability, and protect the platform against abuse or fraud.",
  },
  {
    title: "Sharing and Service Providers",
    body: "We only share information with service providers that help us run the product, such as infrastructure, payments, database hosting, analytics, authentication, and email delivery providers. These providers receive the minimum information needed to perform their services on our behalf.",
  },
  {
    title: "Data Retention and Security",
    body: "We retain event and account information for as long as needed to provide the service, comply with legal obligations, resolve disputes, and maintain operational records. iTicket applies administrative, technical, and organizational safeguards to protect stored data, but no online system can be guaranteed to be perfectly secure.",
  },
  {
    title: "Your Choices",
    body: "Account owners can update or delete event data within the product, and can contact us for privacy-related requests, support, or data questions. If you are an attendee and your information was collected by an organizer using iTicket, please contact that organizer first so they can handle your request directly.",
  },
];

export default async function PrivacyPolicyPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const ar = (await searchParams).locale === "ar";
  const arabicSections = [{"title":"المعلومات التي نجمعها","body":"تعالج iTicket تفاصيل الحساب والحضور والتذاكر والأجهزة والتواصل التي يختار منظمو الفعاليات تخزينها في المنصة. وقد تشمل الأسماء وعناوين البريد الإلكتروني وأرقام الهواتف وسجلات التذاكر وبيانات الفعاليات والسجلات التشغيلية اللازمة لتسجيل الدخول والتسجيل وإدارة الضيوف."},{"title":"كيف نستخدم المعلومات","body":"نستخدم المعلومات لتشغيل موقع iTicket وتطبيقه والمصادقة على المستخدمين ومعالجة التذاكر والتسجيل وإرسال رسائل المعاملات ودعم تشغيل الفعاليات وتحسين الموثوقية وحماية المنصة من إساءة الاستخدام أو الاحتيال."},{"title":"المشاركة ومزودو الخدمات","body":"نشارك المعلومات فقط مع مزودي الخدمات الذين يساعدوننا في تشغيل المنتج، مثل البنية التحتية والدفع واستضافة قواعد البيانات والتحليلات والمصادقة والبريد الإلكتروني. يتلقى هؤلاء الحد الأدنى من المعلومات اللازمة لتنفيذ خدماتهم نيابة عنا."},{"title":"الاحتفاظ بالبيانات وأمنها","body":"نحتفظ بمعلومات الفعاليات والحسابات ما دامت ضرورية لتقديم الخدمة والامتثال للالتزامات القانونية وحل النزاعات وحفظ السجلات التشغيلية. تطبق iTicket ضمانات إدارية وتقنية وتنظيمية لحماية البيانات، لكن لا يمكن ضمان أمان أي نظام إلكتروني بصورة مطلقة."},{"title":"خياراتك","body":"يمكن لأصحاب الحسابات تحديث بيانات الفعاليات أو حذفها داخل المنتج والتواصل معنا بشأن الخصوصية والدعم والبيانات. إذا كنت من الحضور وجمع المنظم معلوماتك باستخدام iTicket، فتواصل مع المنظم أولاً ليتولى طلبك مباشرة."}];
  const displayedSections = ar ? arabicSections : sections;
  return (
    <div className="bg-[#f6f7fb] text-slate-900 min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(124,58,237,0.08),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 backdrop-blur-md">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            {ar ? "المعلومات القانونية" : "Legal"}
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 sm:text-6xl uppercase leading-none">
            {ar ? "سياسة " : "Privacy "}
            <span className="bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              {ar ? "الخصوصية" : "Policy"}
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
            {ar ? "توضح هذه السياسة كيف تجمع iTicket المعلومات وتستخدمها وتحميها عبر الموقع ولوحة التحكم والتطبيق." : "This policy explains how iTicket collects, uses, and protects information across the website, dashboard, and mobile app."}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="space-y-3 pb-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-slate-900">{ar ? "نظرة عامة" : "Overview"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "توفر iTicket أدوات تسجيل الفعاليات والتذاكر والتفاعل مع الحضور وإدارة الضيوف وتسجيل الدخول في الموقع. باستخدام خدماتنا، توافق على معالجة المعلومات وفق هذه السياسة لتقديم تلك الخدمات." : "iTicket provides event registration, ticketing, attendee engagement, guest management, and on-site check-in tools. By using our services, you agree that we may process information as described in this policy to deliver those services."}
            </p>
          </div>

          {displayedSections.map((section, i) => (
            <div key={section.title} className={`space-y-3 ${i < displayedSections.length - 1 ? "pb-6 border-b border-white/5" : ""}`}>
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              <p className="text-sm leading-7 text-slate-600">{section.body}</p>
            </div>
          ))}

          <div id="cookies" className="space-y-3 pb-6 border-b border-white/5 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900">{ar ? "ملفات تعريف الارتباط والتقنيات المشابهة" : "Cookies and Similar Technologies"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "تستخدم iTicket ملفات تعريف الارتباط والتقنيات المرتبطة بها للحفاظ على تسجيل الدخول وتذكر التفضيلات وقياس الأداء وتحسين الموثوقية. عليك الحصول على موافقات الحضور المطلوبة عند تهيئة تقنيات في تجربة فعاليتك، حيثما يلزم." : "iTicket uses cookies and related technologies to keep users signed in, remember product preferences, measure product performance, and improve reliability. Where required, you should obtain any attendee consent needed for technologies you configure in your event experience."}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">{ar ? "تواصل معنا" : "Contact"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "للاستفسار عن الخصوصية أو حماية البيانات، تواصل مع فريقنا عبر " : "For privacy or data protection questions, contact our team at "}
              <Link href="mailto:info@onestonead.com" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                info@onestonead.com
              </Link>
              {ar ? " أو زر " : " or visit the "}
              <Link href={`/contact?locale=${ar ? "ar" : "en"}`} className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                {ar ? "صفحة الدعم" : "support page"}
              </Link>{" "}
              {ar ? "على موقعنا." : "on our website."}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">{ar ? "آخر تحديث: يونيو ٢٠٢٦ · iTicket، منصة ون ستون للإعلان" : "Last updated: June 2026 · iTicket, a OneStone Ads platform"}</p>
      </section>
    </div>
  );
}
