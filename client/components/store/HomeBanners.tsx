const BANNERS = [
  "https://apexmallstore.top/public/uploads/all/prkwuZ2Q7HcLTvb6UdNLTkgHXkBb4QyyXbAxrVDS.png",
  "https://apexmallstore.top/public/uploads/all/usii9Pexr86gDkvT9up3BBY9nvZ4SUeMhvV94aAR.png",
  "https://apexmallstore.top/public/uploads/all/GPp15RTz7snsye09nkwaEe7QmDvvIiiCTyN7wHp8.png",
];

export function HomeBanners() {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BANNERS.map((src, index) => (
          <div
            key={index}
            className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden rounded-md group cursor-pointer border border-border/60 shadow-card hover:shadow-card-hover transition-all duration-300"
          >
            <img
              src={src}
              alt={`Campaign Banner ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

