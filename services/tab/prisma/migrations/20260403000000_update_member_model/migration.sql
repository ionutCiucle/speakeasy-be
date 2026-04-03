-- Drop Participant table
DROP TABLE IF EXISTS "Participant";

-- Drop old Member table (had id + name, no userId)
DROP TABLE IF EXISTS "Member";

-- CreateTable Member with composite PK (tabId, userId)
CREATE TABLE "Member" (
    "tabId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("tabId","userId")
);

-- CreateTable MemberMenuItem with composite PK (tabId, userId, menuItemId)
CREATE TABLE "MemberMenuItem" (
    "tabId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "MemberMenuItem_pkey" PRIMARY KEY ("tabId","userId","menuItemId")
);

-- Remove participants relation from Tab (column doesn't exist, relation only)

-- AddForeignKey Member -> Tab
ALTER TABLE "Member" ADD CONSTRAINT "Member_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey MemberMenuItem -> Member
ALTER TABLE "MemberMenuItem" ADD CONSTRAINT "MemberMenuItem_tabId_userId_fkey" FOREIGN KEY ("tabId", "userId") REFERENCES "Member"("tabId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey MemberMenuItem -> MenuItem
ALTER TABLE "MemberMenuItem" ADD CONSTRAINT "MemberMenuItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
