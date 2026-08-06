-- AlterTable
ALTER TABLE "summaries" ADD COLUMN     "hidden_from_history" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "summaries_user_id_hidden_from_history_created_at_idx" ON "summaries"("user_id", "hidden_from_history", "created_at");
