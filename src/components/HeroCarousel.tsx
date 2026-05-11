"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const SLIDES = [
  { src: "/slide-1.png", alt: "Salon moderne et lumineux" },
  { src: "/slide-2.png", alt: "Cuisine équipée contemporaine" },
  { src: "/slide-3.png", alt: "Chambre chaleureuse" },
];

export function HeroCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  return (
    <div className="relative w-full h-full">
      <Carousel
        plugins={[plugin.current]}
        className="w-full h-full"
        opts={{
          loop: true,
          align: "start",
        }}
      >
        <CarouselContent className="h-full">
          {SLIDES.map((slide, index) => (
            <CarouselItem key={index} className="relative h-[600px] lg:h-full overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/10 z-10" />
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center w-full h-full animate-in fade-in duration-1000"
                priority={index === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      <div className="absolute bottom-8 left-8 right-8 z-20 bg-background/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
        <p className="text-foreground/80 font-medium leading-relaxed italic">
          "Bail-Bail simplifie notre recherche. Les dossiers sont sécurisés, les visites bien organisées, et l'expérience est incroyable."
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            JD
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Jeanne Dupont</p>
            <p className="text-xs text-muted-foreground">Locataire chez Bail-Bail</p>
          </div>
        </div>
      </div>
    </div>
  );
}
