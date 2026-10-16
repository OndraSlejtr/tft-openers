# TFT openers: spec

Status: ready-for-agent

## Problem statement

In the early rounds of a Teamfight Tactics Set 18 game I get offered a handful of cheap champions, a few item components and my first augment choice. Deciding what to do with them takes knowledge I don't reliably have in my head under time pressure. Which champions form a real opener together? Which late game comps can that opener reach? Should my backline build AD or AP items? Does a carry need one specific item? Which augment categories and specific augments push the plan forward?

Tier list sites like tftacademy describe finished comps well, but their early boards are thin and organized per comp. I think about it the other way around. I start from the units I actually got, pick an opener, and keep several possible end comps open until the game decides for me. There is no tool that lets me record my own openers, link each one to several comps, and look them up in seconds from a second monitor during a game.

## Solution

A small static web app, dark themed and built for a second monitor, that works offline from data bundled with the app.

The main screen shows every Set 18 shop champion as a tile, grouped by cost with a divider between cost tiers, plus a text search and a trait filter. I click the champions I hold and the app instantly ranks my saved openers by how well they match. Picking an opener opens a detail view with one row per linked comp. Each row shows which units I still need, the carry's best-in-slot items and the components they need, the augment priority and key augments, and the comp's tier and style. That is enough to steer my next buys, item slams and augment picks.

Openers are mine. I build them in a drag and drop editor by pulling champions into the opener and dropping items onto champions. Comps come read-only from tftacademy through an import script I rerun each patch. The import also suggests draft openers, grouped from tftacademy's early boards, which stay hidden until I promote them. My edits live in the browser on top of the bundled defaults. They are tagged with the patch they were made under, and they survive re-imports. When upstream data changes under something I edited, the app tells me and shows what changed.

## User stories

1. As a player, I want to see all Set 18 shop champions as icon tiles, so that I can find the ones I hold at a glance.
2. As a player, I want the champion tiles grouped by cost with a visible divider between cost tiers, so that I can scan them the way the shop presents them.
3. As a player, I want tile borders colored by cost (gray, green, blue, purple, gold), so that the grid matches what I see in game.
4. As a player, I want Lux's trait variants collapsed into a single Lux tile, so that the grid matches the shop and isn't cluttered.
5. As a player, I want to see a champion's traits when I hover its tile, so that I can check synergies without leaving the grid.
6. As a player, I want to search champions by name, so that I can find a unit faster than by scanning.
7. As a player, I want the search to also match opener and comp names, so that I can jump straight to an opener or comp I remember.
8. As a player, I want to filter the champion grid by trait, so that I can see every unit of a trait I'm leaning toward.
9. As a player, I want to select several champions by clicking their tiles, so that I can describe what I currently hold.
10. As a player, I want to deselect a champion by clicking it again and to clear all selections in one action, so that I can reset between games quickly.
11. As a player, I want openers ranked as soon as I select champions, so that I get guidance without extra clicks.
12. As a player, I want a match on an opener's core champions to count much more than a match on its target champions, so that the ranking reflects what the opener is actually built around.
13. As a player, I want holding a target champion to still raise an opener's rank, so that units I'd buy later anyway count as a signal.
14. As a player, I want openers with an equal match score ordered by the best tier among their linked comps, so that the stronger direction comes first.
15. As a player, I want a separate section listing comps whose final board contains my selected champions, so that I see options even when no opener links to them.
16. As a player, I want each ranked opener to show its core champions, backline damage type and top augment category at a glance, so that I can skim without opening it.
17. As a player, I want to open an opener and see one row per linked comp, so that I can compare the comps it can lead into.
18. As a player, I want each comp row to list the units I still need, sorted by cost, so that I know what to buy and roll for.
19. As a player, I want each comp row to show the carry's best-in-slot items and the components each one needs, so that I know which components to hold or slam.
20. As a player, I want each comp row to show tier and style badges (for example reroll or fast 8), so that I understand the comp's power and game plan.
21. As a player, I want each comp row to show its augment category priority and key augments, so that I know what to pick at each augment stage.
22. As a player, I want the opener's own guidance (backline AD or AP or flexible, required items, augment priority, key augments, notes) shown above the comp rows, so that the shared plan is visible before the comp specifics.
23. As a player, I want opener notes to hold free text such as stage timing tips, so that I can write down nuance the structured fields can't capture.
24. As a player, I want a link to a comp that no longer exists upstream to stay visible, greyed out and marked as no longer in the tier list, so that I notice the opener needs another look.
25. As a player, I want to re-link or remove a dead comp link, so that I can fix the opener after a patch.
26. As a player, I want to create a new opener in an editor, so that I can record an idea after a game.
27. As a player, I want to drag champions from the grid into the opener's core list, so that building an opener feels like building a board.
28. As a player, I want to drag champions into a separate target list, so that I can record the units I'm looking for along the way.
29. As a player, I want to drag a completed item onto a champion in the opener, so that I can mark that champion's best-in-slot items.
30. As a player, I want to set the opener's backline damage type to AD, AP or flexible, so that the item direction is clear.
31. As a player, I want to reorder augment categories (econ, item, combat, special) by dragging, so that I can state which kind of augment I want first.
32. As a player, I want to add key augments through a searchable picker, so that I can find one among roughly 400 without scrolling a grid.
33. As a player, I want to link comps through a searchable picker, so that I can connect the opener to its possible end boards.
34. As a player, I want an opener without a name to get one generated from its core champions, so that I don't have to name every opener.
35. As a player, I want a "create opener from selection" button on the main screen, so that the champions I clicked become the new opener's core.
36. As a player, I want to edit and delete my openers, so that I can keep them accurate.
37. As a player, I want the import to generate draft openers by grouping comps with identical early cores, so that I start from something instead of nothing.
38. As a player, I want draft openers hidden from the main lookup until I promote them, so that tftacademy's noisy early boards don't clutter my results.
39. As a player, I want to review a draft, edit it and promote it, so that I control what shows up during games.
40. As a player, I want to delete or ignore drafts I don't agree with, so that the draft list stays useful.
41. As a player, I want a draft's tftacademy stage tips copied into its notes, so that the upstream advice isn't lost.
42. As a player, I want completed items to carry one or more categories (AD, AP, tanky, utility), so that I can tell what kind of item each one is.
43. As a player, I want components tagged frontline, backline or both, and linked to the completed items they build into, so that I can reason about what to do with a component I just got.
44. As a player, I want augments to carry one or more categories (econ, item, combat, special), so that augment guidance can be expressed by category.
45. As a player, I want trait and hero specific augments categorized as special automatically, so that I don't tag the obvious ones by hand.
46. As a player, I want every other augment to get a guessed category, so that most of the roughly 400 augments are useful without manual work.
47. As a player, I want to click an item or augment chip anywhere in the app to change its categories, so that I can fix a wrong guess the moment I notice it.
48. As a player, I want a data page listing all items and augments, filterable by guessed, confirmed or uncategorized, so that I can clean up categories in one sitting.
49. As a player, I want a category I set by hand marked as confirmed, so that I know which categories I've checked.
50. As a player, I want my openers and category edits saved in the browser automatically, so that nothing is lost between sessions.
51. As a player, I want to export all my edits to a JSON file and import them again, so that I have a backup and can move to another browser.
52. As a player, I want a clear error when an imported backup file is invalid, so that a bad file never silently wipes or corrupts my data.
53. As a player, I want each of my edits to record the patch it was made under, so that after later patches I know how old my judgment is.
54. As a player, I want a badge on any record I edited whose upstream default changed in a later import, so that I can decide whether my version still holds.
55. As a player, I want to see a field-level diff of what changed upstream (units, items, augments, categories), so that I can judge the change quickly.
56. As a player, I want to accept an upstream change or dismiss the badge, so that I stay in control of my data.
57. As a player, I want my edits to win over upstream by default, so that a re-import never overwrites my work.
58. As a player, I want the current data patch shown in the app, so that I know how fresh the bundled data is.
59. As a player, I want the layout to work on a phone too, with the detail rows stacking, so that I can use it when I don't have a second monitor.
60. As a maintainer, I want to refresh all game and comp data with one import command, so that updating for a new patch takes minutes.
61. As a maintainer, I want the import to write trimmed JSON into the repo, so that each patch update is a reviewable diff and the app works offline.
62. As a maintainer, I want the import to fail loudly when a source changes shape or an id can't be resolved, so that broken data never ships silently.
63. As a maintainer, I want the bundled data to carry the set number, so that a future set never mixes with Set 18 openers.
64. As a maintainer, I want the site deployable to GitHub Pages without server configuration, so that hosting stays free and simple.

## Implementation decisions

### Stack

- Vite, React, TypeScript, Tailwind, Vitest, managed with pnpm.
- `react-router` in hash mode, so a static host needs no rewrite rules.
- `dnd-kit` for drag and drop.
- Dark theme only for v1.
- The app is fully static. There is no backend and no login.

### Data sources

- **Community Dragon** (the TFT `en_us` JSON) provides champions, traits, items and augments.
  - Select the set data entry with mutator `TFTSet18`.
  - Item and augment details come from the top-level item list.
  - Components carry the `component` tag. Recipes come from each item's composition.
  - Icon URLs are built from the cdragon game path (lowercased, `.tex` replaced with `.png`) and hotlinked. Many Set 18 augment icons are placeholders upstream, so the UI must fall back to the augment name when an icon is missing.
- **tftacademy** provides comps through the comp tier list's SvelteKit `__data.json` endpoint, decoded with the `devalue` library.
  - Fields used: slug, title, tier, style, difficulty, main champion, early board, final board with items, carousel, augments, augment type priority, stage tips, updated date, and the patch string from the page.
- Champion and item ids are the shared `apiName` values (for example `DA_18_Azir`). They match across both sources for nearly all entries. Any id that doesn't resolve fails the import instead of being dropped.

### Import pipeline

- One maintainer command (`pnpm run import`) fetches both sources and writes the app's data bundle into the repo.
- The fetch layer is thin. All logic sits in one pure transform: raw cdragon JSON plus decoded tftacademy data in, data bundle out.
- The data bundle contains:
  - set number and patch string
  - champions (shop units only, Lux variants collapsed into one tile that remembers the variant ids)
  - traits
  - components with frontline/backline tags and the items they build into
  - completed items (craftables and emblems only, artifacts and radiants excluded) with categories and recipes
  - augments with categories
  - comps
  - draft openers
- **Augment category guessing.** Every guessed category is marked `guessed`.
  - Anything with associated traits or tied to a hero becomes `special`.
  - Gold, interest or XP wording becomes `econ`.
  - Component or item wording becomes `item`.
  - Everything else becomes `combat`.
  - Augment tiers (silver, gold, prismatic) are not used.
- **Item and component tags.** Pre-filled by hand in a curated mapping that the import applies, also marked `guessed` until confirmed in the app.
  - Completed items can have several categories out of AD, AP, tanky and utility.
  - Components are tagged frontline, backline or both.
- **Draft openers.**
  - Comps whose early boards share an identical core are grouped into one draft opener, linked to every comp in the group.
  - Core means early board units that are on the final board or share its main traits. The remaining early units become targets.
  - Stage tips go into notes.
  - Each draft has a stable id derived from its sorted core champion ids, and is marked as sourced from tftacademy with status `draft`.
  - Subset merging (for example A+B into A+B+C) is not done.

### Domain model

- **Opener.** Fields:
  - id
  - name (optional, generated from core champions when empty)
  - core champions
  - target champions
  - backline damage (`AD`, `AP` or `flexible`)
  - required items (a list of champion plus best-in-slot items pairs)
  - augment category priority (an ordered list of the four categories)
  - key augments
  - linked comp ids
  - notes
  - source (`tftacademy` or `user`)
  - status (`draft` or `active`)
- **Comp.** Read-only. It is replaced wholesale on every import and never edited in the app.
- **Opener and comp relationship.** Openers and comps are independent records with a many-to-many link stored on the opener.
- **Category overrides.** These are the user's per-item and per-augment category sets, which replace the bundled guess and are marked `confirmed`.
- **Edit tracking.** Every user-edited record (opener or category override) stores `editedAtPatch`.

### Domain store

- A single module owns all app state and logic.
- It is built from the bundled data plus a storage adapter. The real adapter is localStorage. An in-memory adapter exists for tests.
- **Effective data** is the bundled defaults with the user overlay applied. User edits win.
- **Actions:**
  - create, update, delete and promote openers
  - set or clear category overrides
  - accept or dismiss an upstream change
  - export the overlay to JSON
  - import an overlay from JSON (validated, rejected with an error on any mismatch, never partially applied)
- **Queries:**
  - **Ranked openers for a selection.**
    - Only active openers are included.
    - Score uses a core match weight well above the target match weight.
    - Ties are broken by the best linked comp tier.
  - **Comps containing selected champions.**
  - **Opener detail.**
    - Per linked comp: the missing units sorted by cost, carry items with their components, augment priority and key augments, tier and style.
    - Dead links are flagged when the comp id no longer exists.
  - **Pending upstream changes.**
    - Field-level diffs between the default the user edited against and the current default.
  - **Search** over champions, openers and comps.
- **Persistence.** Storage read and write failures surface as visible errors, never silent drops.
- **Upstream change detection.** When the user edits a record, the store keeps a snapshot or hash of the default it was based on. Later bundle defaults are compared against it.

### UI

- **Main screen.**
  - Champion grid on the left: cost-tier dividers, cost-colored borders, trait icons on hover, text search and a trait filter.
  - Ranked openers on the right, then the "comps with your champions" section.
  - A "create opener from selection" button.
- **Opener detail.**
  - The opener's own guidance on top, then one row per linked comp.
  - On narrow screens the rows stack.
- **Opener editor.**
  - Drag champions into core and target lists.
  - Drag items onto champions for best-in-slot.
  - Drag to reorder augment category priority.
  - Searchable pickers for augments and comps.
  - A backline damage toggle and notes.
- **Drafts list.** Review, edit, promote or delete drafts.
- **Data page.** All items and augments, filterable by guessed, confirmed or uncategorized, with category toggles.
- **Category chips.** Item and augment chips everywhere open a small category toggle.
- **Upstream changes.** A badge on changed records, plus a diff view with accept and dismiss.
- **Deployment.** GitHub Pages through a GitHub Action, added once v1 works.

## Testing decisions

- Tests check external behavior only.
  - **Import transform:** given raw source data, the output bundle is right.
  - **Domain store:** given actions, the query results are right.
  - No tests reach into internal helpers, private state or rendering details.
- **Seam 1: the import transform.**
  - Tested against saved snapshots of real cdragon and tftacademy data, trimmed to keep fixtures small.
  - Covered:
    - Set 18 selection
    - Lux collapsing
    - shop-only champion filtering
    - component tags and recipes
    - artifact exclusion
    - augment category guessing (special detection plus each keyword bucket)
    - draft opener grouping and core/target split
    - stable draft ids
    - loud failure on unresolved ids or changed source shape
- **Seam 2: the domain store.**
  - Driven through its public actions and queries with the in-memory storage adapter.
  - Covered:
    - ranking (core vs target weight, tier tie-break, drafts excluded)
    - comps containing selected champions
    - opener detail (missing units, items with components, dead comp links)
    - overlay merge where user edits win
    - `editedAtPatch` recording
    - upstream change detection and field diffs after a simulated re-import
    - accept and dismiss
    - category overrides
    - export and import round trip
    - rejection of an invalid import with state unchanged
    - visible error on storage failure
- No UI component tests and no end-to-end tests. Drag and drop is covered through the store actions it calls.
- There is no prior art. This is a new repo, so these tests set the pattern.
- `pnpm run test` must pass before every commit.

## Out of scope

- Editing or creating comps. Comps are read-only from tftacademy.
- Artifacts and radiant items.
- Augment tiers.
- Stage-specific structured guidance. Timing tips go in notes.
- Hex board positioning view for comps.
- Light theme.
- Multi-set support and a set switcher. The set number is stored, but only Set 18 is supported.
- Sharing openers with other users, accounts, or any backend.
- Live fetching of source data from the browser.
- Merging draft openers whose cores are subsets of each other.
- UI component and end-to-end tests.

## Further notes

- Repo setup, tooling, the dev sandbox and the agent workflow are described in `README.md` and `CLAUDE.md`. This file is the source of truth for the spec, and issue #1 is a copy.
- The augment tier tag in cdragon is an inferred hash, but tiers are out of scope, so this doesn't matter.
- I couldn't confirm tftacademy's terms of use regarding automated fetching. robots.txt allows the endpoint. The import should run rarely (once per patch) and identify itself with a plain user agent.
- At research time tftacademy listed 68 Set 18 comps on patch 18.4b. Community Dragon listed 74 Set 18 champion entries (65 shop units plus 9 Lux variants) and about 400 unique augments.
