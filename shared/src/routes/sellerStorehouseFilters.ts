interface StorehouseProductFilterInput {
  search?: string;
  category?: string;
  brand?: string;
}

interface ProductNameCondition {
  name: {
    contains: string;
    mode: 'insensitive';
  };
}

interface StorehouseProductWhere {
  isActive: true;
  category?: {
    slug: string;
  };
  AND?: ProductNameCondition[];
}

export function buildStorehouseProductWhere({
  search,
  category,
  brand,
}: StorehouseProductFilterInput): StorehouseProductWhere {
  const nameFilters = [search, brand]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return {
    isActive: true,
    ...(category?.trim() ? { category: { slug: category.trim() } } : {}),
    ...(nameFilters.length
      ? {
          AND: nameFilters.map((value) => ({
            name: { contains: value, mode: 'insensitive' as const },
          })),
        }
      : {}),
  };
}
