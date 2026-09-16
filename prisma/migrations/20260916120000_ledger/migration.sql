-- CreateEnum
CREATE TYPE "LedgerSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "journals" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "postedByUserId" TEXT NOT NULL,
    "description" TEXT,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountUserId" TEXT NOT NULL,
    "side" "LedgerSide" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journals_organizationId_idx" ON "journals"("organizationId");

-- CreateIndex
CREATE INDEX "journals_postedByUserId_idx" ON "journals"("postedByUserId");

-- CreateIndex
CREATE INDEX "journals_reversalOfId_idx" ON "journals"("reversalOfId");

-- CreateIndex
CREATE UNIQUE INDEX "journals_organizationId_idempotencyKey_key" ON "journals"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "journal_lines_accountUserId_idx" ON "journal_lines"("accountUserId");

-- CreateIndex
CREATE INDEX "journal_lines_journalId_idx" ON "journal_lines"("journalId");

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
