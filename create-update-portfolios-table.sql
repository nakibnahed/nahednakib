-- Migration: Update portfolios table for new structure
ALTER TABLE portfolios
  ADD COLUMN overview text,
  ADD COLUMN achievements text,
  ADD COLUMN key_features text,
  ADD COLUMN live_url text,
  ADD COLUMN repo_url text,
  ADD COLUMN status text;

-- Migration: Add technologies column to portfolios table
ALTER TABLE portfolios
  ADD COLUMN technologies text; 