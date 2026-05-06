-- Add isAdmin column safely
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;