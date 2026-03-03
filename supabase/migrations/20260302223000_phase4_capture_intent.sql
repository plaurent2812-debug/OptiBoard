-- Add intent column to captures table
-- This allows categorizing the capture (e.g., 'project', 'memo', 'message')
ALTER TABLE public.captures
ADD COLUMN IF NOT EXISTS intent text;
