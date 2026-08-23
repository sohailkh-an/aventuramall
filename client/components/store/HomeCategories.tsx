import Link from "next/link";
import Image from "next/image";

export const CATEGORIES = [
  {
    name: "Womenswear",
    image: "https://apexmallstore.top/public/uploads/all/iHOjnygPdOMIDICsimZMAMoE0b3NXYGInqETeSBo.png",
    slug: "women-clothing-fashion",
  },
  {
    name: "Menswear",
    image: "https://apexmallstore.top/public/uploads/all/dKDjrCqQs5L8XembeZk3oENQe3sHOckPagdtzwL6.png",
    slug: "men-clothing-fashion",
  },
  {
    name: "Fine Jewelry",
    image: "https://apexmallstore.top/public/uploads/all/P052DIfVaW5aIufaDbbjBvOgzucl1PJAevaLLlPr.png",
    slug: "jewelry-watches",
  },
  {
    name: "Tech & Audio",
    image: "https://apexmallstore.top/public/uploads/all/CcGQCop2RKI8zA80TZEss7YuNRxYSREELseYODlI.png",
    slug: "computer-accessories",
  },
  {
    name: "Kids & Toys",
    image: "https://apexmallstore.top/public/uploads/all/jzCntCVBfilapmbDt6amYKiHanonm7NvMFgLNTl3.jpg",
    slug: "kids-toys",
  },
  {
    name: "Athletics",
    image: "https://apexmallstore.top/public/uploads/all/N3vnccAj2nO1mipj3ErFMaf4Lt87CMOlJ5kyIVyi.png",
    slug: "sports-outdoor",
  },
  {
    name: "Living & Decor",
    image: "https://apexmallstore.top/public/uploads/all/uxhH7xhMgkGFke3iSf7CSzaNUVnyJFekGfP6DwHu.png",
    slug: "automobile-motorcycle",
  },
];

export function HomeCategories() {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between pb-3.5 mb-6 border-b border-border/60">
        <h2 className="text-lg font-bold tracking-tight text-foreground font-serif">
          Curated Departments
        </h2>
        <Link
          href="/search"
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-6 items-start">
        {CATEGORIES.map((category, index) => (
          <Link
            key={index}
            href={`/search?category=${encodeURIComponent(category.slug)}`}
            className="flex flex-col items-center gap-2.5 group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-card border border-border/80 overflow-hidden flex items-center justify-center p-2.5 shadow-card transition-all duration-300 group-hover:border-foreground/40 group-hover:shadow-card-hover group-hover:-translate-y-1">
              <Image
                src={category.image}
                alt={category.name}
                width={80}
                height={80}
                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-center text-foreground/80 line-clamp-1 group-hover:text-foreground group-hover:underline underline-offset-4 transition-colors tracking-wide">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

