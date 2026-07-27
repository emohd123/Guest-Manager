import MagicBento from "@/components/magic-bento/MagicBento";

export const metadata = {
  title: "Magic Bento — iTicket",
};

export default function MagicBentoPage() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center gap-8 bg-white px-4 py-20">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8400ff]">React Bits</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Magic Bento</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          Hover the cards for the spotlight, particle stars, border glow, tilt, and magnetism. Click for the ripple.
        </p>
      </div>

      <MagicBento
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
      />
    </section>
  );
}
