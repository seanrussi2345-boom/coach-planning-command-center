# Architecture

## Phase 1 implementation

The first prototype is a dependency-free HTML/CSS/JavaScript application using native ES modules. This follows the handoff's prototype direction and allows workflow validation without accounts or a backend.

- One staff workspace
- Browser-local persistence
- JSON backup and restore
- Hash-based client routing for static hosting
- Independent GitHub Pages deployment
- No Saturday War Room code or data dependency

## Product architecture target

After Phase 1 workflow approval, migrate the same domain model and route boundaries to:

- Next.js App Router
- React
- TypeScript
- Supabase/PostgreSQL
- Supabase Auth or equivalent
- Role-based permissions
- Cloud synchronization and autosave
- File storage
- Revision history and audit logging
- Vercel deployment with a dedicated project and URL

## Route map

Prototype hash routes map directly to future application routes:

| Prototype | Product route |
| --- | --- |
| `#/dashboard` | `/dashboard` |
| `#/team` | `/team` |
| `#/schedule` | `/schedule` |
| `#/opponents` | `/opponents` |
| `#/opponents/:opponentId` | `/opponents/[opponentId]` |
| `#/weeks/:weekId` | `/weeks/[weekId]` |
| `#/weeks/:weekId/scout` | `/weeks/[weekId]/scout` |
| `#/weeks/:weekId/game-plan` | `/weeks/[weekId]/game-plan` |
| `#/settings` | `/settings` |

## Layout safeguards

- The document body owns vertical scrolling.
- No content card or page region creates a nested vertical scrollbar.
- Headers are not sticky.
- Desktop uses a two-column shell; tablet navigation wraps into a top rail.
- Dense records switch from split grids to stacked cards at tablet widths.
- Gold is an emphasis color, while confidence, approval, and installation states use distinct semantic colors.
