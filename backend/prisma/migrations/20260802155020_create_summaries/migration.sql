-- CreateTable
CREATE TABLE "summaries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(120),
    "author" VARCHAR(120),
    "original_text" TEXT NOT NULL,
    "summary_text" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "summaries_user_id_idx" ON "summaries"("user_id");

-- CreateIndex
CREATE INDEX "summaries_user_id_saved_idx" ON "summaries"("user_id", "saved");

-- CreateIndex
CREATE INDEX "summaries_user_id_favorite_idx" ON "summaries"("user_id", "favorite");

-- CreateIndex
CREATE INDEX "summaries_user_id_created_at_idx" ON "summaries"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
