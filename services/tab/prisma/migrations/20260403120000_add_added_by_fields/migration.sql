-- Drop FK constraints and timestamp columns from MenuItem, add addedBy
ALTER TABLE "MenuItem" DROP CONSTRAINT IF EXISTS "MenuItem_tabId_fkey";
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "MenuItem" ADD COLUMN "addedBy" TEXT NOT NULL DEFAULT '';

-- Drop menuItem FK from MemberMenuItem (menuItemId becomes a plain scalar)
ALTER TABLE "MemberMenuItem" DROP CONSTRAINT IF EXISTS "MemberMenuItem_menuItemId_fkey";

-- Remove paidById from Item and add addedBy
ALTER TABLE "Item" DROP COLUMN IF EXISTS "paidById";
ALTER TABLE "Item" ADD COLUMN "addedBy" TEXT NOT NULL DEFAULT '';
