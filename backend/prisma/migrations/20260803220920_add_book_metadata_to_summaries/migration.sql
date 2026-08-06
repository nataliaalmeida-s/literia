-- AlterTable
ALTER TABLE "summaries" ADD COLUMN     "cover_url" VARCHAR(1000),
ADD COLUMN     "edition_published_date" VARCHAR(40),
ADD COLUMN     "external_book_id" VARCHAR(120),
ADD COLUMN     "first_publication_year" INTEGER,
ADD COLUMN     "isbn" VARCHAR(32),
ADD COLUMN     "metadata_source" VARCHAR(30),
ADD COLUMN     "work_title" VARCHAR(200),
ALTER COLUMN "author" SET DATA TYPE VARCHAR(160);
