'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Product, Category } from '@aventuramall/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  MessageCircle,
  Star,
  Store,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCompare } from '@/hooks/use-compare';
import { useCart } from '@/hooks/use-cart';
import { ProductCard } from '@/components/store/product-card';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

interface ProductWithCategory extends Product {
  category: Category;
  reviews?: ProductReview[];
}

interface ProductReview {
  id: string;
  authorName?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  createdAt?: string | Date | null;
}

function slugifyStoreName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProductPageUI({
  product,
  relatedProducts,
}: {
  product: ProductWithCategory;
  relatedProducts?: ProductWithCategory[];
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const { data: session } = useSession();
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const [fetchedReviews, setFetchedReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewCountState, setReviewCountState] = useState(0);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, product.id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res: any = await apiClient.get(`/api/products/${product.id}/reviews`);
      setFetchedReviews(res.data);
      setReviewCountState(res.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
      return;
    }
    try {
      setSubmittingReview(true);
      await apiClient.post('/api/reviews', {
        productId: product.id,
        rating,
        comment
      });
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (error: any) {
      console.error('Failed to submit review', error);
      alert(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };
  const handleAuthRequiredAction = (action: () => void) => {
    if (!session) {
      router.push('/login');
      return;
    }
    action();
  };

  const handleAddToCart = () => {
    handleAuthRequiredAction(() => addToCart(product, quantity));
  };

  const images = product.images?.length > 0 ? product.images : ['/placeholder.png'];
  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const totalPrice = price * quantity;
  const reviews = fetchedReviews.length > 0 ? fetchedReviews : (product.reviews ?? []);
  const reviewCount = reviewCountState > 0 ? reviewCountState : (product.reviews?.length ?? 0);
  const averageRating =
    reviewCount > 0 ? reviews.reduce((total, review) => total + review.rating, 0) / reviewCount : 0;
  const roundedRating = Math.round(averageRating);
  const relatedProductList = relatedProducts ?? [];
  const hasRelatedProducts = relatedProductList.length > 0;
  const storeSlug = product.soldBy ? slugifyStoreName(product.soldBy) : '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-5 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex flex-row md:flex-col gap-3 w-full md:w-20 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative w-20 md:w-full aspect-square border-2 rounded-md overflow-hidden shrink-0 ${
                  selectedImage === idx ? 'border-brand' : 'border-border/50 hover:border-brand/50'
                }`}
              >
                <img src={img} alt="" className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
          {/* Main Image */}
          <div className="relative w-full aspect-square bg-muted/20 border border-border/50 rounded-md overflow-hidden flex items-center justify-center">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="object-cover w-full h-full max-h-[350px] md:max-h-[500px]"
            />
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="lg:col-span-7 flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-1 mb-4 text-muted-foreground">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= roundedRating ? 'fill-[#ffb900] text-[#ffb900]' : 'fill-muted text-muted'}`}
              />
            ))}
            <span className="text-sm ml-2">
              {reviewCount > 0
                ? `${averageRating.toFixed(1)} (${reviewCount} reviews)`
                : 'No reviews yet'}
              <span className="mx-2 text-border">|</span>
              Estimate Shipping Time: <span className="text-foreground font-medium">2 Days</span>
            </span>
          </div>

          <div className="space-y-6 border-y border-border/50 py-6 my-2">
            {/* Price */}
            <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-start md:items-center gap-1 md:gap-0">
              <span className="text-muted-foreground">Price:</span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-brand">{formatPrice(price)}</span>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-muted-foreground line-through text-lg">
                    {formatPrice(compareAtPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-start md:items-center gap-2 md:gap-0">
              <span className="text-muted-foreground">Quantity:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-md overflow-hidden bg-muted/10">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-start md:items-center gap-1 md:gap-0">
              <span className="text-muted-foreground">Total Price:</span>
              <span className="text-2xl font-bold text-brand">{formatPrice(totalPrice)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:grid md:grid-cols-[100px_minmax(0,1fr)] items-start md:items-center pt-2 gap-4 md:gap-0">
              <span className="text-muted-foreground hidden md:block"></span>
              <div className="grid w-full max-w-[620px] grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  size="lg"
                  className="h-12 w-full min-w-0 rounded-md border-none bg-dull px-4 font-bold text-brand hover:bg-dull/20"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to cart
                </Button>
                <Button
                  size="lg"
                  className="h-12 w-full min-w-0 rounded-md bg-brand px-4 font-bold text-white hover:bg-brand/80"
                  onClick={() => {
                    handleAuthRequiredAction(() => {
                      addToCart(product, quantity);
                      router.push('/cart');
                    });
                  }}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Wishlist / Compare */}
            <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-start md:items-center pt-2 gap-2 md:gap-0">
              <span className="text-muted-foreground hidden md:block"></span>
              <div className="flex items-center gap-6">
                <button
                  className="text-brand cursor-pointer font-medium text-sm hover:underline"
                  onClick={() => handleAuthRequiredAction(() => toggleWishlist(product))}
                >
                  {isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                </button>
                <button
                  className="text-brand cursor-pointer font-medium text-sm hover:underline"
                  onClick={() =>
                    isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product)
                  }
                >
                  {isInCompare(product.id) ? 'Remove from compare' : 'Add to compare'}
                </button>
              </div>
            </div>

            {/* Refund */}
            <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-start md:items-center pt-4 gap-2 md:gap-0">
              <span className="text-muted-foreground">Refund:</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-green-500 shrink-0 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground leading-tight">
                    Active eCommerce Refund Protection
                  </span>
                  <span className="text-sm font-bold leading-tight">
                    30 Days Cash Back Guarantee
                  </span>
                </div>
                <button
                  className="cursor-pointer text-brand text-sm sm:ml-4 hover:underline"
                  onClick={() => router.push('/return-policy')}
                >
                  View Policy
                </button>
              </div>
            </div>

            {/* Share */}
            {/* <div className="flex flex-col md:grid md:grid-cols-[100px_1fr] items-start md:items-center pt-2 gap-2 md:gap-0"> */}
            {/* <span className="text-muted-foreground">Share:</span> */}
            {/* <div className="flex items-center gap-2"> */}
            {/* <Button size="icon" className="w-8 h-8 bg-[#3b5998] hover:bg-[#3b5998]/90 text-white"><Facebook className="w-4 h-4" /></Button> */}
            {/* <Button size="icon" className="w-8 h-8 bg-[#1da1f2] hover:bg-[#1da1f2]/90 text-white"><Twitter className="w-4 h-4" /></Button> */}
            {/* <Button size="icon" className="w-8 h-8 bg-[#ea4335] hover:bg-[#ea4335]/90 text-white"><Mail className="w-4 h-4" /></Button> */}
            {/* <Button size="icon" className="w-8 h-8 bg-[#0077b5] hover:bg-[#0077b5]/90 text-white"><Linkedin className="w-4 h-4" /></Button> */}
            {/* <Button size="icon" className="w-8 h-8 bg-[#25d366] hover:bg-[#25d366]/90 text-white"><MessageCircle className="w-4 h-4" /></Button> */}
            {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 bg-dull p-6 rounded-sm">
        {/* Left: Sold By */}
        <div className="lg:col-span-3">
          <div className="bg-background rounded-sm p-4 flex flex-col gap-4 sticky top-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sold by</p>
                <h3 className="font-bold text-base">{product.soldBy || 'All Royal Collection'}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#ffb900] flex items-center justify-center text-white text-xs">
                <Star className="w-5 h-5 fill-white" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-y border-border/50 py-4 gap-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= roundedRating ? 'fill-[#ffb900] text-[#ffb900]' : 'fill-muted text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount} customer {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {storeSlug ? (
                <Link
                  href={`/stores/${storeSlug}`}
                  className={cn(
                    buttonVariants(),
                    'flex-1 rounded-md border-none bg-[#ffe5df] font-bold text-brand hover:bg-[#ffcdc2]'
                  )}
                >
                  <Store className="h-4 w-4" />
                  Visit Store
                </Link>
              ) : (
                <Button
                  disabled
                  className="flex-1 rounded-md border-none bg-[#ffe5df] font-bold text-addbrand hover:bg-[#ffcdc2]"
                >
                  <Store className="h-4 w-4" />
                  Visit Store
                </Button>
              )}
              <div className="flex items-center gap-1">
                {/* <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground"><Facebook className="w-4 h-4" /></Button> */}
                {/* <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground"><Twitter className="w-4 h-4" /></Button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Description & Reviews Tabs */}
        <div className="lg:col-span-9 bg-background rounded-sm">
          <div className="flex items-center overflow-x-auto border-b border-border px-2 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`shrink-0 px-4 py-4 text-sm sm:px-6 sm:text-base ${
                activeTab === 'description'
                  ? 'border-b-2 border-brand font-medium text-brand'
                  : 'border-b-2 border-transparent font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`shrink-0 px-4 py-4 text-sm sm:px-6 sm:text-base ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-brand font-medium text-brand'
                  : 'border-b-2 border-transparent font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer'
              }`}
            >
              Reviews ({reviewCount})
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'description' ? (
              <>
                <h3 className="text-lg font-bold mb-4">About this item</h3>

                <div className="prose prose-sm sm:prose-base max-w-none text-foreground/80 mb-8">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      {product.description ||
                        'Detailed description for this product goes here. High quality materials and premium build.'}
                    </li>
                    <li>Structure: 1 main compartment, 1 inner zip pocket, 2 slip pockets.</li>
                    <li>
                      PERFECT GIFT CHOICE: Suitable for young women, adaptable to more occasions.
                    </li>
                  </ul>
                </div>

                {product.descriptionImages && product.descriptionImages.length > 0 && (
                  <div className="mt-8 space-y-4">
                    {product.descriptionImages.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt="Product Detail"
                        className="w-full max-w-4xl mx-auto border border-border/50 rounded-md"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-md border border-border/70 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer reviews</p>
                    <h3 className="mt-1 text-2xl font-bold text-foreground">
                      {reviewCount > 0 ? averageRating.toFixed(1) : 'No reviews yet'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${s <= roundedRating ? 'fill-[#ffb900] text-[#ffb900]' : 'fill-muted text-muted'}`}
                      />
                    ))}
                  </div>
                </div>

                {reviewCount === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-4 py-10 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe5df] text-brand">
                      <MessageCircle className="h-7 w-7" />
                    </div>
                    <h4 className="text-lg font-bold text-foreground">No reviews yet</h4>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Be the first customer to share feedback about this product.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-md border border-border/70 p-4 sm:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="font-bold text-foreground">
                              {review.title || 'Customer review'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {review.user?.name || review.authorName || 'Verified customer'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${s <= review.rating ? 'fill-[#ffb900] text-[#ffb900]' : 'fill-muted text-muted'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                {/* Write Review Form */}
                <div className="mt-10 border-t border-border/50 pt-8">
                  <h3 className="text-xl font-bold mb-6">Write a Review</h3>
                  {session ? (
                    <form onSubmit={submitReview} className="space-y-4 max-w-2xl">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setRating(s)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-8 w-8 ${s <= rating ? 'fill-[#ffb900] text-[#ffb900]' : 'fill-muted text-muted'} hover:fill-[#ffb900] hover:text-[#ffb900] transition-colors`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">Your Review (optional)</label>
                        <textarea
                          id="comment"
                          rows={4}
                          className="w-full rounded-md border border-border/70 bg-background p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          placeholder="What did you like or dislike?"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-brand text-white hover:bg-brand/90"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  ) : (
                    <div className="rounded-md border border-border/70 bg-muted/10 p-6 text-center">
                      <p className="text-muted-foreground mb-4">You must be logged in to write a review.</p>
                      <Button onClick={() => router.push('/login')} className="bg-brand text-white hover:bg-brand/90">
                        Login to Review
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-brand">
              More to explore
            </p>
            <h2 className="text-2xl font-bold text-foreground">Related Products</h2>
          </div>
          {product.category?.name && (
            <p className="text-sm text-muted-foreground">
              Similar picks from {product.category.name}
            </p>
          )}
        </div>

        {hasRelatedProducts ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {relatedProductList.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-border bg-muted/10 px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No related products found for this item.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
