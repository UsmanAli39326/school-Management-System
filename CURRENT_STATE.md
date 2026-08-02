# School Management System — Agent Loop State

Last updated: 2026-07-28 (loop 1)

## DONE

- **BUG-1** — `/school/*` routes now render inside `SchoolShell` (sidebar, topbar, footer). Replaced `src/app/school/layout.js` with auth-guard + `SchoolShell` wrapper (previously lived only in unused `School-layout.js`). Deleted orphan `src/components/layout/School-layout.js`. Note: prior breadcrumb/back-bar UI from the old layout was removed; navigation is via `SchoolShell` only.

## OPEN

- [ ] **BUG-2**: DevTechnoz footer visibility is conditioned on sidebar-open state in `SchoolShell.js` and `SuperAdminShell.js` — decouple so it always renders regardless of sidebar state.
- [ ] **BUG-3**: Bottom `<Footer/>` sits below the fold inside a scrollable `<main>` on data-heavy pages — make it visually reachable (sticky or moved outside the scroll container).
- [ ] **BUG-4**: `saveDailyAttendance` doc ID concatenates fields with `_` with no delimiter safety — switch to a safe composite key or nested path.
- [ ] **BUG-5**: Access control is hardcoded per-page (`allowedRoles={['TEACHER']}` etc.) — refactor into a central permissions map.
- [ ] **BUG-6**: Audit `firestore.rules` to confirm every collection enforces `schoolId` scoping.
- [ ] **BUG-7**: `getActivityLogs()` in `logs.js` runs with no `schoolId` filter — must add required `schoolId` param for school-scoped callers.
- [ ] **BUG-8**: `logActivity(...)` is never called from school-level mutations — wire audit logging into all mutation modules.
- [ ] **FEATURE-1**: Admin-configurable student attendance access.
- [ ] **FEATURE-2**: Staff attendance module.
- [ ] **FEATURE-3**: School-admin staff action log.
- [ ] **FEATURE-4**: Super-admin cross-school log console.
- [ ] **FEATURE-5**: Data encryption (read caveats in loop spec before implementing).

## NEEDS_HUMAN_INPUT

- (none yet)

## Notes

- `npm run build` completed successfully (exit 0) after clearing `.next`; all 34 routes compiled. A concurrent retry build failed with `.next` ENOENT (race on `500.html` rename) — not a code error.
- Firebase Admin SDK warns during build: missing `project_id` in service account (expected without local env).
- Repo cloned from https://github.com/UsmanAli39326/school-Management-System; `git pull` not run this loop.
