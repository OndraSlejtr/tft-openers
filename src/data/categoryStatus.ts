export type CategoryStatus = "guessed" | "confirmed" | "uncategorized";

// Entries with a user override arrive here with guessed set to false, so they count as confirmed.
export const categoryStatus = ({ categories, guessed }: { categories: string[]; guessed: boolean }): CategoryStatus => {
  if (categories.length === 0) return "uncategorized";
  return guessed ? "guessed" : "confirmed";
};
