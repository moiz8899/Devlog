ALTER TABLE "Message"
ADD COLUMN "storyId" TEXT,
ADD COLUMN "storyMediaUrl" TEXT;

CREATE INDEX "Message_storyId_idx" ON "Message"("storyId");

ALTER TABLE "Message"
ADD CONSTRAINT "Message_storyId_fkey"
FOREIGN KEY ("storyId") REFERENCES "Story"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
