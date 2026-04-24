"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const slides = [
  {
    src: "/background1.jpg",
    alt: "Outdoor pickleball court at SmashCourt",
  },
  {
    src: "/background2.jpg",
    alt: "Indoor pickleball court at SmashCourt",
  },
];

export function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative flex min-h-[640px] items-center overflow-hidden px-[6vw] pt-20 lg:min-h-screen lg:px-[8vw]">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 ${
              activeSlide === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(0,0,0,0.64)_0%,rgba(0,0,0,0.38)_55%,rgba(0,0,0,0.12)_100%)]" />
      </div>

      <div className="relative z-10 max-w-xl pt-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold uppercase text-white/90">
          <span className="h-2 w-2 rounded-full bg-coral" />
          Now accepting reservations
        </div>
        <h1 className="font-serif text-6xl font-black leading-none text-white md:text-7xl lg:text-8xl">
          Play your
          <br />
          <em className="font-serif italic text-peach">best game</em>
          <br />
          anytime.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-white/85">
          Four premium pickleball courts. Book by the hour, play on your schedule, and see availability update
          instantly.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-bold text-cream transition hover:-translate-y-0.5 hover:bg-coral"
            href="#booking"
          >
            Reserve a Court
            <ArrowRight size={17} aria-hidden="true" />
          </a>
          <a
            className="rounded-full border border-white/60 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            href="#courts"
          >
            View Courts
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-[6vw] z-10 flex gap-2 lg:left-[8vw]">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            aria-label={`Show hero slide ${index + 1}`}
            className={`h-3 w-3 rounded-full transition ${
              activeSlide === index ? "scale-125 bg-coral" : "bg-white/55 hover:bg-white"
            }`}
            type="button"
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>

      <div className="absolute bottom-8 right-[8vw] z-10 hidden gap-8 text-right lg:flex">
        {[
          ["4", "Courts"],
          ["6am", "Opens"],
          ["10pm", "Closes"],
        ].map(([value, label]) => (
          <div key={label}>
            <div className="font-serif text-3xl font-bold leading-none text-white">{value}</div>
            <div className="mt-1 text-xs font-semibold uppercase text-white/65">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
