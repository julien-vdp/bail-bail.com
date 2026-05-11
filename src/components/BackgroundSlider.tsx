"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export function BackgroundSlider({ slides }: { slides: { src: string; alt: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-900">
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover object-center w-full h-full"
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}
      
      {/* Dark gradient overlay to make text readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10 z-10" />
      <div className="absolute inset-0 bg-black/20 z-10" />
    </div>
  );
}
