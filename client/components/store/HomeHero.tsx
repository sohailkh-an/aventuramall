'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@aventuramall/shared';
import { ProductCard } from './product-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/use-currency';
import { ArrowRight, Sparkles } from 'lucide-react';

const HERO_SLIDES = [
  {
    image:
      'https://apexmallstore.top/public/uploads/all/SKD7fE5FhtdAONyHp7bkREechQFr7lM7vPJXJ2pu.jpg',
    tagline: 'AUTUMN / WINTER MAISON EDIT',
    title: 'HAUTE COUTURE & TIMELESS LUXURY',
    description:
      'Explore the definitive curation of designer ready-to-wear, leather goods, and iconic accessories.',
    cta: 'DISCOVER NOW',
    link: '/search?category=women-clothing-fashion',
  },
  {
    image:
      'https://apexmallstore.top/public/uploads/all/eGSZ3dbJIFxdDhmg2XKsYLrUPG06xZDu9ENtwkXz.jpg',
    tagline: 'FINE JEWELRY & WATCHES',
    title: 'PRECISION MEETS ARTISTRY',
    description:
      'Masterfully crafted timepieces and high jewelry from prestigious Swiss and Parisian houses.',
    cta: 'VIEW COLLECTION',
    link: '/search?category=jewelry-watches',
  },
  {
    image:
      'https://apexmallstore.top/public/uploads/all/F2zsxmNIJh0EksUfSd1r8lx8ETMdgnJtEZY6Q1lG.png',
    tagline: 'NEW FLAGSHIPS',
    title: 'AVENTURA MALL MIAMI',
    description: 'South Florida’s premier luxury fashion and lifestyle epicenter.',
    cta: 'EXPLORE SHOPS',
    link: '/brands',
  },
];

interface HomeHeroProps {
  dealProducts: Product[];
}

export function HomeHero({ dealProducts }: HomeHeroProps) {
  const { formatPrice } = useCurrency();
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: true }),
    []
  );
  const carouselPlugins = React.useMemo(() => [autoplayPlugin], [autoplayPlugin]);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Editorial Carousel (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <Carousel
            plugins={carouselPlugins}
            className="w-full h-full relative group rounded-lg overflow-hidden border border-border/60 bg-card"
            opts={{ loop: true }}
          >
            <CarouselContent className="h-full">
              {HERO_SLIDES.map((slide, index) => (
                <CarouselItem key={index} className="h-full">
                  <div className="relative aspect-[16/9] lg:aspect-[16/10] xl:aspect-[21/11] w-full overflow-hidden flex items-end">
                    {/* Background Image with subtle gradient overlay */}
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    {/* Editorial Content Overlay */}
                    <div className="relative z-10 p-6 md:p-10 max-w-xl flex flex-col gap-2.5 text-white">
                      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-white/80 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-white" />
                        {slide.tagline}
                      </span>
                      <h1
                        className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] text-white"
                        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                      >
                        {slide.title}
                      </h1>
                      <p className="text-xs md:text-sm text-white/85 line-clamp-2 leading-relaxed font-light mt-1">
                        {slide.description}
                      </p>
                      <div className="pt-3">
                        <Link
                          href={slide.link}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] rounded-sm hover:bg-white/90 hover:gap-3 transition-all duration-300 shadow-md"
                        >
                          <span>{slide.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Subtle Controls on Hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <CarouselPrevious className="left-4 bg-background/80 hover:bg-background text-foreground border border-border shadow-md" />
              <CarouselNext className="right-4 bg-background/80 hover:bg-background text-foreground border border-border shadow-md" />
            </div>
          </Carousel>
        </div>

        {/* Curator's Spotlight / Today's Edit (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-card border border-border/80 rounded-lg p-5 flex flex-col h-full shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/60">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                  Curated Picks
                </span>
                <h2 className="text-base font-bold tracking-tight text-foreground font-serif">
                  Curator&apos;s Edit
                </h2>
              </div>
              <Link
                href="/search?sort=popular"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                All Picks →
              </Link>
            </div>

            {/* List */}
            <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-hide">
              {dealProducts.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex items-center gap-3.5 p-2 rounded-md hover:bg-muted/40 transition-colors border border-transparent hover:border-border/60"
                >
                  <div className="w-16 h-20 shrink-0 bg-muted/40 rounded-sm overflow-hidden relative border border-border/50">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        AM
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Exclusive
                    </span>
                    <h3 className="text-xs font-medium text-foreground line-clamp-1 group-hover:underline underline-offset-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-foreground font-serif">
                        {formatPrice(Number(product.price))}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatPrice(Number(product.compareAtPrice))}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-border/60">
              <Link
                href="/search"
                className="w-full py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-foreground border border-border rounded hover:bg-foreground hover:text-background transition-all block"
              >
                Browse All 200+ Flagships
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
