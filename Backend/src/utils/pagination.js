const paginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Number(page) > 0 ? Number(page) : 1;

  return {
    currentPage,
    totalPages,
    totalItems,
    limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

export default paginationMeta;
