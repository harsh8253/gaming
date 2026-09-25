---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: ["frontend/src/components/WagerDeskShell.tsx"]
---

# WagerDesk desk (all signed-in routes)

Mode: Operate. Primary scene: masters checking exposure and bets on a phone during live matches; back-office work on desktop.
Pinned by the user: shadcn/ui-grade real components (Radix, vaul, cmdk, sonner), navy #172554 + blue brand, light theme.

## Direction contract

THESIS: Exposure is a position. The desk reads like a light, dense trading terminal (watchlist, positions, order ticket), refusing the SaaS grid of identical icon-tile KPI cards and eyebrow chips.

OWN-WORLD: White panels on #f5f6f8 with hairline rules instead of boxed cards; navy chrome, blue selection; green/red deltas; Geist with tabular figures, Geist Mono for IDs; shadcn Tabs, Drawer, Dialog, DropdownMenu, Command, Sonner.

STORY: An operator sees live fixtures and exposure first, drills into a bet or client in a draggable sheet, places a bet through an order ticket.

FIRST VIEWPORT: Desktop: top nav bar, persistent market-watch panel left, summary band of positions, then the list. Phone: compact header, summary band swipes, list rows, thumb FAB, tab bar.

FORM: Trading Terminal, my list position 1 (IMPECCABLE'S PICK), seed f53edabf.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
