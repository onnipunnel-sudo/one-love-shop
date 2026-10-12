'use client';
// CSS-only hero banner carousel (radio-button technique, no JS timers).

const SLIDES = [
  {
    title: 'ONE LOVE Mega Sale',
    sub: 'Up to 40% off luxury gifts & more',
    cta: 'Shop Flash Sale',
    bg: 'radial-gradient(1200px 500px at 20% 10%, #3a2f10 0%, #141416 60%), linear-gradient(135deg,#1a1a1e,#0d0d0f)',
  },
  {
    title: 'Gifts That Say It All',
    sub: 'Golden gift boxes, hampers & keepsakes',
    cta: 'Explore Gifts',
    bg: 'radial-gradient(1000px 500px at 80% 20%, #3a2f10 0%, #141416 60%), linear-gradient(225deg,#1a1a1e,#0d0d0f)',
  },
  {
    title: 'New Electronics Arrivals',
    sub: 'Earbuds, speakers & smart gadgets',
    cta: 'Shop Electronics',
    bg: 'radial-gradient(1100px 500px at 50% 100%, #2c2408 0%, #141416 65%), linear-gradient(180deg,#16161a,#0d0d0f)',
  },
];

export function HeroCarousel() {
  return (
    <div className="relative overflow-hidden rounded-xl ring-1 ring-gold/20">
      {SLIDES.map((s, i) => (
        <div key={s.title}>
          <input
            type="radio"
            name="hero-slide"
            id={`hero-${i}`}
            defaultChecked={i === 0}
            className="peer hidden"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 peer-checked:opacity-100"
            style={{ background: s.bg }}
          >
            <div className="flex h-44 flex-col justify-center px-6 sm:h-60 sm:px-10">
              <div className="font-serif text-2xl text-gold sm:text-4xl">{s.title}</div>
              <div className="mt-2 text-sm text-neutral-300 sm:text-base">{s.sub}</div>
              <span className="mt-4 inline-block w-fit rounded-md bg-gold px-4 py-2 text-sm font-bold text-black">
                {s.cta}
              </span>
            </div>
          </div>
        </div>
      ))}
      {/* Spacer keeps carousel height (slides are absolute) */}
      <div className="h-44 sm:h-60" />
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <label
            key={s.title}
            htmlFor={`hero-${i}`}
            className="h-2.5 w-2.5 cursor-pointer rounded-full bg-white/25 transition hover:bg-gold"
          />
        ))}
      </div>
    </div>
  );
}
