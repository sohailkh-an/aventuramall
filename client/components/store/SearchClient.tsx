'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Product, Category } from '@tiktokshop/shared';
import { ProductCard } from '@/components/store/product-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Boxes, Filter, Search, SlidersHorizontal, Star, Store } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrency } from '@/hooks/use-currency';

interface ProductWithCategory extends Product {
  category: Category;
}

interface PublicStore {
  name: string;
  slug: string;
  productCount: number;
  categories: string[];
  ratingStats: {
    averageRating: number;
    reviewCount: number;
  };
}

interface SearchClientProps {
  initialProducts: ProductWithCategory[];
  initialStores: PublicStore[];
  searchQuery: string;
  allCategories: Category[];
  initialCategory?: string;
}

interface SearchClientContentProps extends SearchClientProps {
  maxProductPrice: number;
}

interface FilterContentProps {
  availableCategories: Array<{ slug: string; name: string }>;
  selectedCategories: string[];
  priceRange: [number, number];
  maxProductPrice: number;
  onCategoryToggle: (slug: string) => void;
  onPriceRangeChange: (value: [number, number]) => void;
  onClearFilters: () => void;
}

const ITEMS_PER_PAGE = 12;

export function SearchClient({
  initialProducts,
  initialStores,
  searchQuery,
  allCategories,
  initialCategory,
}: SearchClientProps) {
  const maxProductPrice =
    initialProducts.length > 0 ? Math.max(...initialProducts.map((p) => Number(p.price))) : 1000;
  const resetKey = `${searchQuery}:${initialCategory ?? ''}:${maxProductPrice}`;


  return (
    <SearchClientContent
      key={resetKey}
      initialProducts={initialProducts}
      initialStores={initialStores}
      searchQuery={searchQuery}
      allCategories={allCategories}
      initialCategory={initialCategory}
      maxProductPrice={maxProductPrice}
    />
  );
}

function FilterContent({
  availableCategories,
  selectedCategories,
  priceRange,
  maxProductPrice,
  onCategoryToggle,
  onPriceRangeChange,
  onClearFilters,
}: FilterContentProps) {
  const { currency, convertPrice } = useCurrency();
  const exchangeRate = convertPrice(1);

  return (
    <div className="space-y-8">
      {availableCategories.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Categories</h3>
          <div className="space-y-3">
            {availableCategories.map((cat) => (
              <div key={cat.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${cat.slug}`}
                  checked={selectedCategories.includes(cat.slug)}
                  onCheckedChange={() => onCategoryToggle(cat.slug)}
                />
                <label
                  htmlFor={`cat-${cat.slug}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {cat.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Price Range</h3>
        <Slider
          defaultValue={[0, maxProductPrice]}
          max={maxProductPrice}
          step={1}
          value={priceRange}
          onValueChange={(val) => onPriceRangeChange(val as [number, number])}
          className="my-6"
        />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 w-full">
            <Label className="text-xs text-muted-foreground">Min</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currency}
              </span>
              <Input
                type="number"
                value={convertPrice(priceRange[0])}
                onChange={(e) =>
                  onPriceRangeChange([Number(e.target.value || 0) / exchangeRate, priceRange[1]])
                }
                className="pl-12"
              />
            </div>
          </div>
          <div className="space-y-1 w-full">
            <Label className="text-xs text-muted-foreground">Max</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currency}
              </span>
              <Input
                type="number"
                value={convertPrice(priceRange[1])}
                onChange={(e) =>
                  onPriceRangeChange([priceRange[0], Number(e.target.value || 0) / exchangeRate])
                }
                className="pl-12"
              />
            </div>
          </div>
        </div>
      </div>

      {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxProductPrice) && (
        <Button variant="outline" className="w-full" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

function SearchClientContent({
  initialProducts,
  initialStores,
  searchQuery,
  allCategories,
  initialCategory,
  maxProductPrice,
}: SearchClientContentProps) {
  const [sortOption, setSortOption] = useState<string>('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxProductPrice]);

  // Extract unique categories from all categories provided
  const availableCategories = useMemo(() => {
    return allCategories.map((cat) => ({ slug: cat.slug, name: cat.name }));
  }, [allCategories]);

  const handleCategoryToggle = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    setSortOption(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxProductPrice]);
    setCurrentPage(1);
  };

  const filteredAndSortedProducts = useMemo(() => {
    // Filter
    const result = initialProducts.filter((p) => {
      // Category filter
      if (selectedCategories.length > 0 && p.category) {
        if (!selectedCategories.includes(p.category.slug)) return false;
      }

      // Price filter
      if (Number(p.price) < priceRange[0] || Number(p.price) > priceRange[1]) return false;

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [initialProducts, selectedCategories, priceRange, sortOption]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const filterContent = (
    <FilterContent
      availableCategories={availableCategories}
      selectedCategories={selectedCategories}
      priceRange={priceRange}
      maxProductPrice={maxProductPrice}
      onCategoryToggle={handleCategoryToggle}
      onPriceRangeChange={handlePriceRangeChange}
      onClearFilters={handleClearFilters}
    />
  );

  return (
    <div className="container bg-dull rounded-sm mx-auto px-6 py-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-muted-foreground">
            Showing {filteredAndSortedProducts.length} products
            {initialStores.length > 0 ? ` and ${initialStores.length} stores` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Mobile Filter Trigger */}
          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="md:hidden flex items-center gap-2" />}>
              <Filter className="w-4 h-4" />
              Filters
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              {filterContent}
            </SheetContent>
          </Sheet>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-[280px] shrink-0 space-y-6 sticky top-24 h-fit">
          <div className="bg-background p-6 border-0 rounded-sm shadow-sm">
            {filterContent}
          </div>
        </aside>

        <div className="flex-1">
          {initialStores.length > 0 && (
            <section className="mb-8 space-y-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-normal text-brand">
                  Stores
                </p>
                <h2 className="text-xl font-bold text-foreground">Matching sellers</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {initialStores.map((store) => (
                  <Link
                    key={store.slug}
                    href={`/stores/${store.slug}`}
                    className="group rounded-md border border-border/70 bg-background p-4 shadow-sm transition-colors hover:border-brand/60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand text-white">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-foreground group-hover:text-brand">
                          {store.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Boxes className="h-3.5 w-3.5" />
                            {store.productCount} products
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {store.ratingStats.reviewCount > 0
                              ? `${store.ratingStats.averageRating.toFixed(1)} rating`
                              : 'No ratings'}
                          </span>
                        </div>
                        {store.categories.length > 0 && (
                          <p className="mt-2 truncate text-xs text-muted-foreground">
                            {store.categories.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Product Grid */}
          {filteredAndSortedProducts.length > 0 ? (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pb-12">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed text-center px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground max-w-md">
                We could not find any products matching your current filters and search query. Try
                adjusting your filters or search term.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  handleClearFilters();
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
