export type CategoryStatus = "guessed" | "confirmed" | "uncategorized";

// Nothing is confirmed yet, confirming comes with the user's category overrides.
export const categoryStatus = ({ categories, guessed }: { categories: string[]; guessed: boolean }): CategoryStatus => {
  if (categories.length === 0) return "uncategorized";
  return guessed ? "guessed" : "confirmed";
};
