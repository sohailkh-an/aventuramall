import { HomeBrands } from "@/components/store/HomeBrands"

export default function BrandsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
          Our Partner Brands
        </h1>
        <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
          We work with the world's leading brands to bring you the highest quality products at the best prices.
        </p>
      </div>

      <HomeBrands showAll />

      {/* If there were more brands, they could be listed here in a more dense list */}
    </div>
  )
}
