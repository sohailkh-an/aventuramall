import Image from "next/image";
import Link from "next/link";
import { Clock, User, Calendar, ChevronLeft, Share2, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";

const BLOG_POSTS = {
  "1": {
    id: 1,
    title: "Top 10 Fashion Trends for Summer 2026",
    content: `
      <p>As the temperatures rise, the fashion world is heating up with some of the most innovative and expressive trends we've seen in years. Summer 2026 is defining itself through a unique blend of high-tech functionality and raw, organic aesthetics.</p>
      
      <h3>1. Eco-Luxe Fabrics</h3>
      <p>Sustainability is no longer a niche; it's the standard. This summer, expect to see luxury garments made from lab-grown silk and recycled ocean plastics that feel as premium as they look. These fabrics aren't just good for the planet—they offer superior breathability and moisture-wicking properties for those humid July afternoons.</p>
      
      <h3>2. Neon Earth Tones</h3>
      <p>It sounds like a contradiction, but it works. Think deep terracotta with a hint of electric orange, or forest green with a lime-glow finish. This trend bridges the gap between our digital lives and our physical environment.</p>
      
      <h3>3. Utility Chic</h3>
      <p>Cargo pockets are back, but with a refined silhouette. We're seeing oversized pockets on tailored linen trousers and sleek vests that allow you to carry your essentials without the need for a bulky bag.</p>
      
      <h3>Conclusion</h3>
      <p>Whether you're hitting the beach or the city streets, the key to Summer 2026 is comfort meeting innovation. Don't be afraid to mix textures and bold colors to find your own unique summer voice.</p>
    `,
    date: "May 1, 2026",
    author: "Elena Rodriguez",
    image: "/blogs/fashion.png",
    category: "Fashion",
    readTime: "5 min read",
  },
  "2": {
    id: 2,
    title: "The Ultimate Guide to Building Your Smart Home",
    content: `
      <p>Building a smart home can feel like a daunting task, but with the right approach, it can transform your daily life into a seamless, automated experience. It's not just about gadgets; it's about creating an ecosystem that works for you.</p>
      
      <h3>Start with the Hub</h3>
      <p>The brain of your smart home is your central hub. Whether you choose a voice-activated speaker or a dedicated wall-mounted panel, this device will coordinate all your other gadgets. Make sure you choose a hub that is compatible with the majority of smart devices on the market.</p>
      
      <h3>Intelligent Lighting</h3>
      <p>One of the easiest entry points into smart home tech is lighting. Smart bulbs allow you to set schedules, change colors, and even sync your lights with your favorite movies or music. More importantly, they can help you save energy by automatically turning off when you leave a room.</p>
      
      <h3>Safety First</h3>
      <p>Automated security systems, including smart locks and video doorbells, provide peace of mind like never before. You can monitor your home from anywhere in the world and receive instant alerts if anything unusual is detected.</p>
      
      <p>Remember, the goal of a smart home is to simplify your life, not complicate it. Start small and expand your system as you become more comfortable with the technology.</p>
    `,
    date: "April 24, 2026",
    author: "David Chen",
    image: "/blogs/smarthome.png",
    category: "Technology",
    readTime: "8 min read",
  },
  "3": {
    id: 3,
    title: "Essential Skincare Routines for Glowing Skin",
    content: `
      <p>Healthy skin is the foundation of any beauty routine. Achieving that coveted "glow" doesn't require a hundred different products—it requires consistency and the right ingredients for your skin type.</p>
      
      <h3>The Golden Rule: Cleansing</h3>
      <p>Never sleep in your makeup. Double cleansing—using an oil-based cleanser followed by a water-based one—is the most effective way to remove impurities without stripping your skin of its natural oils.</p>
      
      <h3>Hydration is Key</h3>
      <p>Drinking water is important, but topical hydration is just as vital. Look for serums containing hyaluronic acid, which can hold up to 1000 times its weight in water, keeping your skin plump and youthful.</p>
      
      <h3>Sun Protection Always</h3>
      <p>If you only do one thing for your skin, let it be sunscreen. UV rays are responsible for the majority of premature aging. Apply a broad-spectrum SPF every single morning, regardless of the weather.</p>
      
      <p>Listen to your skin. If a product causes irritation, stop using it immediately. Skincare is a journey of discovery, and what works for one person might not work for another.</p>
    `,
    date: "April 15, 2026",
    author: "Sophia Patel",
    image: "/blogs/skincare.png",
    category: "Beauty & Health",
    readTime: "6 min read",
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = BLOG_POSTS[id as keyof typeof BLOG_POSTS];

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/blogs"
          className="inline-flex items-center text-brand font-semibold mb-8 hover:translate-x-[-4px] transition-transform"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Blogs
        </Link>

        <article className="bg-dull rounded-sm overflow-hidden shadow-sm border border-gray-100">
          {/* Header Image */}
          <div className="relative h-[300px] md:h-[450px] w-full">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-6 left-6">
              <span className="bg-brand text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                {post.category}
              </span>
            </div>
          </div>

          <div className="p-8 md:p-12">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                  {post.author[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground font-semibold">{post.author}</span>
                  <span className="text-xs">Author</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                <span>{post.readTime}</span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="w-5 h-5" />
                  <span>12</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-8 leading-tight">
              {post.title}
            </h1>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none text-foreground 
              [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-10 [&_h3]:mb-4
              [&_p]:mb-6 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
              [&_li]:mb-2
              [&_strong]:text-foreground [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
