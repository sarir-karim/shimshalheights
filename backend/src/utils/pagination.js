/** Turns validated page/limit into skip/limit and builds the pagination meta block. */
export function paginate({ page = 1, limit = 20 }) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  return { skip: (safePage - 1) * safeLimit, limit: safeLimit, page: safePage };
}

export const pageMeta = ({ page, limit }, total) => ({ page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
