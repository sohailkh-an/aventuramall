import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BRANDS = [
  { name: "Dior", logo: "https://apexmallstore.top/public/uploads/all/V9qcS2Y69nRCWO7YsKibtFL1PxOcdYuIYMllM055.jpg", slug: "dior" },
  { name: "Rolex", logo: "https://apexmallstore.top/public/uploads/all/9bQ5QpR05o6E6BYwsDQuBfnldwxBJiu4ri0wQsDk.jpg", slug: "rolex" },
  { name: "Apple", logo: "https://apexmallstore.top/public/uploads/all/OORNgOuuK7i6LpaAmneoZ7XJhyXjGhn9oM2C3sHP.jpg", slug: "apple" },
  { name: "SEPHORA", logo: "https://apexmallstore.top/public/uploads/all/V9qcS2Y69nRCWO7YsKibtFL1PxOcdYuIYMllM055.jpg", slug: "sephora" },
  { name: "Victoria's Secret", logo: "https://apexmallstore.top/public/uploads/all/rTnF7lkUo98xSabKEL33PB8Jy2wTriBdbuaEInWK.jpg", slug: "victorias-secret" },
  { name: "Sony", logo: "https://apexmallstore.top/public/uploads/all/32t6dhIilYusFyl7qDNolVLppb4v9sUJxF6foHBZ.jpg", slug: "sony" },
  { name: "Aigner", logo: "https://apexmallstore.top/public/uploads/all/werJ5uEXwIGCN2T5yC8hStWBTK9lHaOuIfRMDNUg.jpg", slug: "aigner" },
  { name: "Adidas", logo: "https://apexmallstore.top/public/uploads/all/pnJLUOOCynVS3zcwiKKQaTfoI80XROjVbHb2HkXX.jpg", slug: "adidas" },
  { name: "Samsung", logo: "https://apexmallstore.top/public/uploads/all/CHiPPwWsYyBSKA86NensGpbPkF1PujSxg3UjyACn.jpg", slug: "samsung" },
  { name: "Polo Ralph Lauren", logo: "https://apexmallstore.top/public/uploads/all/3mL9NlTwr0AdQmdYFXWYljhrNehkski5mjy71kYz.jpg", slug: "polo" },
  { name: "Puma", logo: "https://apexmallstore.top/public/uploads/all/rcpEO7fXVzm4kaejPNwqw6fwyZSwJEx5zyx953QB.jpg", slug: "puma" },
  { name: "Olay", logo: "https://apexmallstore.top/public/uploads/all/DqyQvgF1X3lvgOIei06o0zv6vgy4SUxlfLHzRIwZ.svg", slug: "olay" },
];

export function HomeBrands({ showAll = false }: { showAll?: boolean }) {
  const brandsToDisplay = showAll ? BRANDS : BRANDS.slice(0, 12);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between pb-3.5 mb-8 border-b border-border/60">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
            Boutique Directory
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-serif">
            Iconic Maisons & Brands
          </h2>
        </div>
        {!showAll && (
          <Link
            href="/brands"
            className={buttonVariants({
              variant: "editorial",
              size: "sm",
              className: "text-[11px]",
            })}
          >
            All 200+ Flagships →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {brandsToDisplay.map((brand) => (
          <Link
            key={brand.slug}
            href={`/search?q=${encodeURIComponent(brand.name)}`}
            className={cn(
              "group flex items-center justify-center bg-card border border-border/70 rounded-md p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover hover:border-foreground/40 hover:-translate-y-0.5 h-[90px] sm:h-[110px]"
            )}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                className="object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 p-2"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

