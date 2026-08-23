import Image from 'next/image';
import Link from 'next/link';
import { Clock, User } from 'lucide-react';

export const metadata = {
  title: 'Blogs - Aventura Mall Store',
  description: 'Read our latest articles on fashion, tech, and lifestyle.',
};

const blogs = [
  {
    id: 1,
    title: 'Top 10 Fashion Trends for Summer 2026',
    excerpt:
      "Discover the vibrant colors, breathable fabrics, and bold accessories that are defining this season's hottest looks. Stay ahead of the curve with our curated summer fashion guide.",
    date: 'May 1, 2026',
    author: 'Elena Rodriguez',
    image: '/blogs/fashion.png',
    category: 'Fashion',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'The Ultimate Guide to Building Your Smart Home',
    excerpt:
      'Transform your living space into a futuristic haven. From intelligent lighting to automated security, learn how to integrate the latest smart home devices seamlessly.',
    date: 'April 24, 2026',
    author: 'David Chen',
    image: '/blogs/smarthome.png',
    category: 'Technology',
    readTime: '8 min read',
  },
  {
    id: 3,
    title: 'Essential Skincare Routines for Glowing Skin',
    excerpt:
      'Achieve that flawless, radiant complexion with our step-by-step skincare guide. We break down the best ingredients and daily habits for maintaining healthy, beautiful skin.',
    date: 'April 15, 2026',
    author: 'Sophia Patel',
    image: '/blogs/skincare.png',
    category: 'Beauty & Health',
    readTime: '6 min read',
  },
];

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Our Latest Articles
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Stay updated with the latest trends, tips, and guides across fashion, technology,
            beauty, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <article
              key={blog.id}
              className="bg-dull rounded-sm overflow-hidden shadow-sm transition-all duration-300 group flex flex-col"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    {blog.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{blog.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{blog.readTime}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-brand transition-colors">
                  <Link href={`/blogs/${blog.id}`} className="before:absolute before:inset-0">
                    {blog.title}
                  </Link>
                </h2>

                <p className="text-sm text-foreground/60 line-clamp-3 mb-6 flex-grow">
                  {blog.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-foreground/80">{blog.date}</span>
                  <span className="text-brand font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Read More →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
