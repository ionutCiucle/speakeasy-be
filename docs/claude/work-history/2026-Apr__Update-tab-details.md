# 2026-Apr__Update-tab-details

## Status: COMPLETE ✓

## Goal

Consolidate the tab member/participant model, add a `MemberMenuItem` junction table so members can select quantities of menu items, replace granular menu item CRUD with a single bulk-replace endpoint, and add a new endpoint for updating a member's item selections.

---

## Schema changes (`services/tab/prisma/schema.prisma`)

- **`Member`** — replaced `id: String @id` + `name: String` with a composite PK `@@id([tabId, userId])`. A member is now always an app user identified by `userId`. Added `memberMenuItems MemberMenuItem[]` relation.
- **`MemberMenuItem`** — new junction table with composite PK `@@id([tabId, userId, menuItemId])` and a `quantity: Int` field. Relations to `Member` and `MenuItem`.
- **`Participant`** — dropped entirely. `Member` with `userId` now covers this concept.
- **`Tab`** — removed `participants Participant[]` relation.
- Migration: `20260403000000_update_member_model`

---

## Endpoint changes

### Replaced
- `POST /:id/menu-items`, `PATCH /:id/menu-items/:menuItemId`, `DELETE /:id/menu-items/:menuItemId` — removed (granular menu item operations)
- `POST /:id/participants` — removed (superseded by `Member`)

### Updated
- `PATCH /:id` — now does a **name-based sync** of menu items (upsert by name, delete removed) to preserve `MenuItem` IDs across updates, keeping `MemberMenuItem` foreign keys intact
- `POST /:id/members` — body changed from `{ name }` to `{ userId }`
- `DELETE /:id/members/:memberId` → `DELETE /:id/members/:userId`

### Added
- `PATCH /:id/members/:userId/items` — replaces a member's item selections with `{ items: { menuItemId, quantity }[] }`. Validates that every `menuItemId` exists in the tab's menu. Returns the updated member with their items populated.

---

## Store changes (`store.ts`)

- `createTab` — `members` input changed to `{ userId }[]`; creator is auto-added as a member (deduped)
- `updateTabMenuItems` — switched from `deleteMany + createMany` to name-based sync (delete removed, create new, update changed prices) to preserve IDs
- `addMember` — now takes `userId` instead of `name`
- `findMemberById` / `removeMember` — now take `(tabId, userId)` and use the composite PK
- `updateMemberItems` — new; full replace via `deleteMany + createMany` in a transaction; returns the member with `memberMenuItems` populated
- `tabInclude` — updated: removed `participants`, added `memberMenuItems { include: { menuItem: true } }` on members

---

## Validation (`routes.ts`)

- `createTabSchema` — `members` items changed from `{ name }` to `{ userId: string.min(1) }`
- `updateMemberItemsSchema` — new; validates `items: { menuItemId: string.min(1), quantity: int.positive() }[]`

---

## Test counts after this change

| Service | Tests |
|---|---|
| tab | 48 |
