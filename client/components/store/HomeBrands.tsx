import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BRANDS = [
  { name: "ACER", logo: "https://apexmallstore.top/public/uploads/all/Qyu62ZY0ss41fWrfsn7kEDIje6fe37SO7Q8QAjN4.jpg", slug: "acer" },
  { name: "Adidas", logo: "https://apexmallstore.top/public/uploads/all/pnJLUOOCynVS3zcwiKKQaTfoI80XROjVbHb2HkXX.jpg", slug: "adidas" },
  { name: "Aigner", logo: "https://apexmallstore.top/public/uploads/all/werJ5uEXwIGCN2T5yC8hStWBTK9lHaOuIfRMDNUg.jpg", slug: "aigner" },
  { name: "Alosa", logo: "https://apexmallstore.top/public/uploads/all/oPP6xKO0Op5RjL6s23z0MO61Dx1mhCpCqKgCWqF1.jpg", slug: "alosa" },
  { name: "Apato", logo: "https://apexmallstore.top/public/uploads/all/MqAWwfnjrVjNSgdEMeXfv5oC18HKVElmZlNxc3Z2.jpg", slug: "apato" },
  { name: "Apple", logo: "https://apexmallstore.top/public/uploads/all/OORNgOuuK7i6LpaAmneoZ7XJhyXjGhn9oM2C3sHP.jpg", slug: "apple" },
  { name: "ASUS", logo: "https://apexmallstore.top/public/uploads/all/hKVK9fJ4AFupftAHV6fCQF3ysYfxlEXCha1NrSEH.jpg", slug: "asus" },
  { name: "Yamaha", logo: "https://apexmallstore.top/public/uploads/all/J37EphmHxcn76CVbWkMtRFxrg9ZC7D16BFghMb6F.jpg", slug: "yamaha" },
  { name: "millet", logo: "https://apexmallstore.top/public/uploads/all/DHZu4mN6igPh8C5QYJXDmlmY53ybdpHrhveWDzAe.jpg", slug: "millet" },
  { name: "Wood worm", logo: "https://apexmallstore.top/public/uploads/all/SdYdA5C1d5rtQIfql5lmAbDMhwoXij7ug4M3HVHm.jpg", slug: "wood-worm" },
  { name: "Volvo", logo: "https://apexmallstore.top/public/uploads/all/gTCDxIFKlOwj09v3eNvHDEjWi35kLAFkYdCm06O2.jpg", slug: "volvo" },
  { name: "Victoria's Secret", logo: "https://apexmallstore.top/public/uploads/all/rTnF7lkUo98xSabKEL33PB8Jy2wTriBdbuaEInWK.jpg", slug: "victorias-secret" },
  { name: "Urban decay", logo: "https://apexmallstore.top/public/uploads/all/26AUkrxaz6uHIX5js628FlgzxkGPaTO272uugCQd.jpg", slug: "urban-decay" },
  { name: "Toy Pinot", logo: "https://apexmallstore.top/public/uploads/all/tt2J5mWmnyeIKfueLlUjvDDRQwOkHSnr7zXjnv34.jpg", slug: "toy-pinot" },
  { name: "Toyota", logo: "https://apexmallstore.top/public/uploads/all/BY9Ye6rjMOzVp1ukAaueI7V29XShRNJaMucauqVs.jpg", slug: "toyota" },
  { name: "Crystal bride", logo: "https://apexmallstore.top/public/uploads/all/ZBpqXAOzb5dUgcuXFBAW1JzmDsd799wKI47nazfJ.jpg", slug: "crystal-bride" },
  { name: "Tanishk", logo: "https://apexmallstore.top/public/uploads/all/fhFa6jg83kOniwjPL3kEjc9EIIXPm359IVagKqfB.jpg", slug: "tanishk" },
  { name: "Reebok", logo: "https://apexmallstore.top/public/uploads/all/IhbWqyrbpQUHZd60sqz2ffGIlY5MgdhKHTZrJEVd.jpg", slug: "reebok" },
  { name: "OnePlus", logo: "https://apexmallstore.top/public/uploads/all/bfPIXVgrCkICsvbSHLlAZGTdiPJKBACckvsLoBxq.jpg", slug: "oneplus" },
  { name: "Sony", logo: "https://apexmallstore.top/public/uploads/all/32t6dhIilYusFyl7qDNolVLppb4v9sUJxF6foHBZ.jpg", slug: "sony" },
  { name: "Samsung", logo: "https://apexmallstore.top/public/uploads/all/CHiPPwWsYyBSKA86NensGpbPkF1PujSxg3UjyACn.jpg", slug: "samsung" },
  { name: "SEPHORA", logo: "https://apexmallstore.top/public/uploads/all/V9qcS2Y69nRCWO7YsKibtFL1PxOcdYuIYMllM055.jpg", slug: "sephora" },
  { name: "polo", logo: "https://apexmallstore.top/public/uploads/all/3mL9NlTwr0AdQmdYFXWYljhrNehkski5mjy71kYz.jpg", slug: "polo" },
  { name: "Suzuki", logo: "https://apexmallstore.top/public/uploads/all/c0I0b7h4VyhtWml1r2VfXUWJcT030iRMPo1ce8nb.jpg", slug: "suzuki" },
  { name: "Riyal Enfield", logo: "https://apexmallstore.top/public/uploads/all/k0Td8c4mZmuZM3HPaqTs0nKbuFkvHH5Eq9i3ANqW.jpg", slug: "riyal-enfield" },
  { name: "Rolex", logo: "https://apexmallstore.top/public/uploads/all/9bQ5QpR05o6E6BYwsDQuBfnldwxBJiu4ri0wQsDk.jpg", slug: "rolex" },
  { name: "Rezel", logo: "https://apexmallstore.top/public/uploads/all/MRrFaDAdrWuhAPUldiaH14t8HZlrbkCmKoUIZRfI.jpg", slug: "rezel" },
  { name: "Rolls-Royce", logo: "https://apexmallstore.top/public/uploads/all/k3WaSqzF2y9wfyxw10WrKO7JpztQEh2fUYWaBajO.jpg", slug: "rolls-royce" },
  { name: "Royal Enfield", logo: "https://apexmallstore.top/public/uploads/all/U4eIpiFD7xSs8dC0cHJrOoKmiRyEZENgkisFJJ0s.jpg", slug: "royal-enfield" },
  { name: "philips", logo: "https://apexmallstore.top/public/uploads/all/q0LUGrqfNrbV9PwjyBvkLzGgN5tTnmyKYhMffagF.jpg", slug: "philips" },
  { name: "Puma", logo: "https://apexmallstore.top/public/uploads/all/rcpEO7fXVzm4kaejPNwqw6fwyZSwJEx5zyx953QB.jpg", slug: "puma" },
  { name: "pampers", logo: "https://apexmallstore.top/public/uploads/all/vEBIDdc30eGS5qOD6Bdi2Me43FWn6OoWjiWGwbLK.jpg", slug: "pampers" },
  { name: "Infant care", logo: "https://apexmallstore.top/public/uploads/all/tANxEVyOqqb30C3i74Hi2QrSTnWkMsWElO1IDM63.jpg", slug: "infant-care" },
  { name: "Baby clothing", logo: "https://apexmallstore.top/public/uploads/all/py27sISY1n99ZNWGDeId0ScEOD2QmzNHD2XHwnpY.jpg", slug: "baby-clothing" },
  { name: "Baby TV", logo: "https://apexmallstore.top/public/uploads/all/3z3WXL6Wn9IZ3jyYabVkZ5oqOfLPxuFVBLx2ZkoA.jpg", slug: "baby-tv" },
  { name: "Belly baby", logo: "https://apexmallstore.top/public/uploads/all/Xx14wYPN78ebultLs03WzCXe47vVDUGoZwSFhOSB.jpg", slug: "belly-baby" },
  { name: "axe", logo: "https://apexmallstore.top/public/uploads/all/oFGUkLfBvgcsglUEp6tgMkOA5znlSgVJlHStruQb.jpg", slug: "axe" },
  { name: "Baby and Me", logo: "https://apexmallstore.top/public/uploads/all/Dvc6F2Ht7jyGGfx1fv704bz1dSWUMaChwbSSwP11.jpg", slug: "baby-and-me" },
  { name: "audi", logo: "https://apexmallstore.top/public/uploads/all/DYRuBljh1IMi24ibQJWwyxtlbO9unim0YgVVLQO6.jpg", slug: "audi" },
  { name: "Bass Vampire", logo: "https://apexmallstore.top/public/uploads/all/uUIDqCc4DhkkXrAmpjc4nVtOnjjAvQAyoDIRvMZz.jpg", slug: "bass-vampire" },
  { name: "Fila", logo: "https://apexmallstore.top/public/uploads/all/bhEF3tppFebHsbBxMJynJtfNwgetuHjsKg0YsqPT.png", slug: "fila" },
  { name: "Enfagrow", logo: "https://apexmallstore.top/public/uploads/all/453uv6mgMcPWQP2aSXK09plNmbtO9SPj1ZdB9j6U.jpg", slug: "enfagrow" },
  { name: "Aptamil", logo: "https://apexmallstore.top/public/uploads/all/g7dkHt3eeb1mlclzO8vD31pXkgyfdEkFzKg3MZ6B.png", slug: "aptamil" },
  { name: "Olay", logo: "https://apexmallstore.top/public/uploads/all/DqyQvgF1X3lvgOIei06o0zv6vgy4SUxlfLHzRIwZ.svg", slug: "olay" },
]

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

