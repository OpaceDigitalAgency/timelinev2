-- Fix overlapping eras by adjusting date ranges
UPDATE "public"."eras" 
SET "end_year" = '-50001' 
WHERE "name" = 'Prehistoric';

-- Add a comment explaining the change
COMMENT ON TABLE "public"."eras" IS 'Historical time periods with non-overlapping date ranges';