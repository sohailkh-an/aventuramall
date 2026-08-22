export interface PosProductsPageMeta {
  page: number;
  totalPages: number;
}

export function getNextPosProductsPageParam(meta: PosProductsPageMeta) {
  if (meta.page >= meta.totalPages) return undefined;

  return meta.page + 1;
}
