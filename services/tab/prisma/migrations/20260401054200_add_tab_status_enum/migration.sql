CREATE TYPE "TabStatus" AS ENUM ('active', 'closed');

ALTER TABLE "Tab" DROP COLUMN "status";
ALTER TABLE "Tab" ADD COLUMN "status" "TabStatus" NOT NULL DEFAULT 'active';
