import { describe, expect, it } from "vitest";
import { filterByText } from "./filterByText.ts";

const augments = [{ name: "Golden Ticket" }, { name: "Cybernetic Uplink" }, { name: "Gold Rush" }];

describe("filterByText", () => {
  it("matches case insensitively anywhere in the text", () => {
    expect(filterByText(augments, "GOLD", ({ name }) => name).map(({ name }) => name)).toEqual(["Golden Ticket", "Gold Rush"]);
  });

  it("returns everything for blank search text", () => {
    expect(filterByText(augments, "  ", ({ name }) => name)).toHaveLength(3);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterByText(augments, "zzz", ({ name }) => name)).toEqual([]);
  });
});
