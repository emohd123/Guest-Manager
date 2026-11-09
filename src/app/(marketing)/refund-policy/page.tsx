import Link from "next/link";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "Book with confidence, check before paying",
    body: "Ticket purchases are final. We do not offer refunds for a change of mind, a booking mistake, or a change in your personal plans. Before payment, please confirm the date, venue, ticket category, and entry requirements. Exceptions for significant event changes are explained below, and your mandatory legal rights always remain protected.",
  },
  {
    title: "If the event you booked changes significantly",
    body: "You may request a refund if the event is cancelled, moved to another date, or changed in a way that materially affects the experience advertised when you booked. This can include a significant venue change or the cancellation of the headline performance. The organiser’s notice will explain the available options. You may be offered the choice to keep your ticket for a rescheduled event instead. Refund requests are reviewed against the actual change and applicable law.",
  },
  {
    title: "Changes that do not normally qualify",
    body: "Minor changes to event timings or duration, changes to supporting performers, or personal preference about the experience do not normally qualify for a refund, unless the event’s terms or applicable law say otherwise. If you do not attend, arrive after the last admission time, or are refused entry for not meeting clearly published entry rules, a refund is not normally available, subject to applicable law.",
  },
  {
    title: "How to submit a request",
    body: "Contact the event organiser in writing using the contact details on the event page or in the event notice. Include the event name and date, your order or transaction reference, ticket number(s), the purchaser’s name, and the email address and phone number used for the order. Do not send full payment-card details. If you cannot reach the organiser or need help locating your order, contact iTicket through our contact page.",
  },
  {
    title: "The service charge is separate",
    body: "Any ticketing service charge is shown separately in the order summary before you pay. An approved ticket refund excludes this service charge: it is retained and is not included in the ticket-price refund. This exclusion does not apply where applicable law requires the service charge to be refunded, including where a legally required refund covers a service that was not provided.",
  },
  {
    title: "Approved refunds",
    body: "Once a refund is approved, we will confirm the refundable ticket amount and any service charge being retained. The refund is generally returned to the payment method used for the purchase. The time for funds to appear depends on the payment provider and your bank. No additional refund-administration fee is imposed by this policy.",
  },
  {
    title: "Free registrations",
    body: "A free registration has no ticket price to refund. If you cannot attend, please cancel or notify the organiser when possible so the place can be released to someone else.",
  },
];

export default async function RefundPolicyPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const ar = (await searchParams).locale === "ar";
  const arabicSections = [{"title":"احجز بعد مراجعة التفاصيل","body":"شراء التذاكر نهائي. لا نقدم استرداداً عند تغيير الرأي أو الخطأ في الحجز أو تغيير الخطط الشخصية. يرجى التأكد من التاريخ والمكان وفئة التذكرة وشروط الدخول قبل الدفع. توضح السياسة أدناه الاستثناءات المتعلقة بالتغييرات الجوهرية، وتبقى حقوقك القانونية الإلزامية محفوظة."},{"title":"إذا تغيرت الفعالية بشكل جوهري","body":"يمكنك طلب الاسترداد عند إلغاء الفعالية أو نقلها إلى تاريخ آخر أو تغييرها بما يؤثر جوهرياً في التجربة المعلن عنها وقت الحجز. وقد يشمل ذلك تغييراً جوهرياً في المكان أو إلغاء العرض الرئيسي. يوضح إشعار المنظم الخيارات المتاحة، وقد يعرض عليك الاحتفاظ بالتذكرة للموعد الجديد. تراجع الطلبات بناءً على التغيير الفعلي والقانون المعمول به."},{"title":"تغييرات لا تستوجب الاسترداد عادةً","body":"التغييرات الطفيفة في التوقيت أو المدة، أو تغيير الفنانين المساندين، أو التفضيلات الشخصية بشأن التجربة لا تستوجب الاسترداد عادةً، ما لم تنص شروط الفعالية أو القانون على خلاف ذلك. كذلك لا يتاح الاسترداد عادةً عند عدم الحضور أو التأخر عن آخر موعد للدخول أو رفض الدخول بسبب عدم استيفاء شروط الدخول المعلنة بوضوح، مع مراعاة القانون."},{"title":"كيفية تقديم الطلب","body":"تواصل كتابةً مع منظم الفعالية عبر بيانات الاتصال الواردة في صفحة الفعالية أو إشعارها. أرفق اسم الفعالية وتاريخها ورقم الطلب أو المعاملة وأرقام التذاكر واسم المشتري والبريد الإلكتروني ورقم الهاتف المستخدمين في الطلب. لا ترسل بيانات بطاقتك المصرفية كاملة. إذا تعذر التواصل مع المنظم أو احتجت للمساعدة في العثور على طلبك، تواصل مع iTicket عبر صفحة التواصل."},{"title":"رسوم الخدمة منفصلة","body":"تعرض رسوم خدمة التذاكر منفصلة في ملخص الطلب قبل الدفع. لا يشمل استرداد قيمة التذكرة المعتمد رسوم الخدمة؛ إذ تحتفظ بها الخدمة ولا تدخل ضمن المبلغ المسترد. لا يسري هذا الاستثناء عندما يوجب القانون استرداد رسوم الخدمة، بما في ذلك عندما يشمل الاسترداد الإلزامي قانوناً خدمة لم تقدم."},{"title":"الطلبات المعتمدة للاسترداد","body":"عند اعتماد الاسترداد، نؤكد قيمة التذاكر القابلة للاسترداد ورسوم الخدمة التي سيحتفظ بها. يعاد المبلغ عادةً إلى وسيلة الدفع الأصلية. تعتمد مدة ظهور المبلغ على مزود الدفع والبنك. لا تفرض هذه السياسة أي رسوم إدارية إضافية لمعالجة الاسترداد."},{"title":"التسجيل المجاني","body":"لا توجد قيمة تذكرة لاستردادها في التسجيل المجاني. إذا تعذر حضورك، يرجى الإلغاء أو إخطار المنظم متى أمكن لإتاحة المكان لشخص آخر."}];
  const displayedSections = ar ? arabicSections : sections;
  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <section className="relative overflow-hidden px-4 pb-16 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            {ar ? "المعلومات القانونية" : "Legal"}
          </div>
          <h1 className="text-4xl font-black uppercase leading-tight tracking-tighter sm:text-6xl">
            {ar ? "سياسة " : "Refund "}<span className="text-blue-600">{ar ? "الاسترداد" : "Policy"}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
            {ar ? "معلومات الإلغاء وتغيير التذاكر وطلبات الاسترداد للفعاليات المعروضة على iTicket." : "Information about cancellations, ticket changes, and refund requests for events listed on iTicket."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <h2 className="text-xl font-bold">{ar ? "نهجنا" : "Our approach"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "توضح هذه السياسة حالات استرداد قيمة التذاكر لدى iTicket وكيفية التعامل مع رسوم الخدمة الموضحة بشكل منفصل. يتولى المنظم تنفيذ الفعالية والإعلان عن تغييراتها. لا تحد هذه السياسة من حقوق المستهلك التي لا يجوز استبعادها قانوناً." : "This policy explains when an iTicket ticket purchase can be refunded and how the separately disclosed service charge is treated. The organiser handles event delivery and announces event changes. Nothing in this policy limits consumer rights that cannot legally be excluded."}
            </p>
          </div>

          {displayedSections.map((section, index) => (
            <div
              key={section.title}
              className={`space-y-3 ${index < displayedSections.length - 1 ? "border-b border-slate-100 pb-6" : ""}`}
            >
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="text-sm leading-7 text-slate-600">{section.body}</p>
            </div>
          ))}

          <div className="space-y-3 border-t border-slate-100 pt-6">
            <h2 className="text-xl font-bold">{ar ? "مساعدة المستهلك في البحرين" : "Consumer assistance in Bahrain"}</h2>
            <p className="text-sm leading-7 text-slate-600">
              {ar ? "هذه السياسة ليست استشارة قانونية. للمعلومات عن حقوق المستهلك أو تقديم شكوى، اطلع على معلومات البحرين الرسمية بشأن " : "This policy is not legal advice. For information about consumer rights or to raise a complaint, visit Bahrain’s official "}
              <a
                href="https://www.bahrain.bh/wps/portal/en/BNP/HomeNationalPortal/ContentDetailsPage/%21ut/p/z1/tVRdd9ogGP4r2YWXBkgixks_qnWdc41N13DjwYRUNgKUoG7_fqQ9Z6uxuvVi3ADnfR7er-cFEPAAiKR7_kgtV5IKd88IXqN5D17HYwi_TKIA3t4PEjxaILiYheDrMWCQplOI49k0inCc9Ht9QF6b0V0KHX8-TJbTCYI3sM1vASJ0zD_nH55ZQ_hv_D_x3w0wxEEwjILVLITL9_JPAeRyeJfzv2n7v50ELjw0_pxOYzReRif-TwDkcnr3gACic16ALC8hgrSgXYwx60YDhLo0Z71uHpZB2GObsohZg86l1XYLso3Ua2o68KfaGU_wknlcehu6NZTLDsyVrHcVM542yrK80ZNHZeEZZikXdQcaJqhlhWeV5nn9imD449bW4OPfSu-0yb89PZGhC0lJy35Y8PCfY8pctfvrdhNHSTAK3eFTAFZNgejzyyA76NrXyljBbO0LLr83xmanWj8XXFU-31T-Qfu0qLj0t0y4o9b-gQlnZH4u1K5wPSZvyOi339kyeBNwPAYXB7GZs5ZSTgb5Jfdz_Zi7UdhzdgCpVKZyP8fqncK6hkBX6cuq4rAn9pXbcHJVLq7C6MMvpY75pw%21%21/dz/d5/L0lDUmlTV0EhL3dPa0FKRnRnLzROV3FpQSEhL2Vu/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                {ar ? "حماية المستهلك" : "consumer-protection information"}
              </a>
              {ar ? ". ويمكنك التواصل مع iTicket عبر " : ". You can also contact iTicket through our "}
              <Link href={`/contact?locale=${ar ? "ar" : "en"}`} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                {ar ? "صفحة التواصل" : "contact page"}
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          {ar ? "آخر تحديث: نوفمبر ٢٠٢٦ · iTicket، منصة ون ستون للإعلان" : "Last updated: November 2026 · iTicket, a OneStone Ads platform"}
        </p>
      </section>
    </div>
  );
}
