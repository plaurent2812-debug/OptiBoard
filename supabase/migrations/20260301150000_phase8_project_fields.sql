-- Add missing fields to Projects table

ALTER TABLE projects
  ADD COLUMN description text;
