# Phase 1 Data Model

The workspace is intentionally shaped around the handoff's proposed entities and can be normalized into PostgreSQL tables later.

## Implemented records

- `Organization`
- `Team`
- `Season`
- `StaffUser` / `StaffRole`
- `Opponent`
- `Game`
- `WeeklyPlan`
- `ScoutObservation` / `Tendency`
- `SituationTag`
- `GamePlanAnswer`
- `Revision`

## Required metadata

Important planning records carry creator, last editor, created and updated timestamps, status, confidence or approval state, linked opponent/game/week identifiers, and a lightweight revision trail.

## Source-state separation

Scouting observations must label their source state as one of:

- verified opponent observation;
- staff interpretation;
- experimental idea.

Game-plan answers have a separate approval state and are never represented as verified opponent facts.
