// Case insensitive text search for the pickers. Empty search text matches everything.
export const filterByText = <T>(entries: readonly T[], searchText: string, textOf: (entry: T) => string): T[] => {
  const normalizedSearch = searchText.trim().toLowerCase();
  return entries.filter((entry) => textOf(entry).toLowerCase().includes(normalizedSearch));
};
