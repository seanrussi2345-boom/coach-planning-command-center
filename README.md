# Coach Planning Command Center

A standalone, football-first planning platform for real coaching staffs.

## Protected project boundary

This repository is independent from Saturday War Room. It has its own code, deployment workflow, visual identity, data model, and browser-storage namespace. The existing repository `seanrussi2345-boom/cfb27-defensive-playbook-lab` is protected read-only reference material and is not a dependency of this application.

## Phase 1

The prototype covers:

- team, season, and staff setup;
- opponent and game setup;
- independent weekly workspaces;
- weekly dashboard and completion metrics;
- opponent tendencies and scouting observations;
- planned answers linked to each tendency;
- coach ownership, approval, installation, practice, and game-day status;
- browser-local autosave;
- complete-workspace JSON export and import;
- lightweight change history;
- desktop-first and tablet-capable responsive layout.

## Deployment

GitHub Pages deploys only the `site/` directory from this repository. The intended independent URL is:

`https://seanrussi2345-boom.github.io/coach-planning-command-center/`

## Storage isolation

The prototype reads and writes only:

`coach-planning-command-center.workspace.v1`

## Product architecture target

After Phase 1 workflow validation, migrate the same domain boundaries to Next.js, React, TypeScript, Supabase/PostgreSQL, authenticated staff workspaces, role-based permissions, cloud synchronization, file storage, version history, and audit logging on an independent Vercel deployment.