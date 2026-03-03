-- Phase 1: Security Patch for Privilege Escalation
-- Prevent users from updating their own role or organization_id.

CREATE OR REPLACE FUNCTION protect_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the request is executed by an authenticated user (not service_role)
  -- Reset the protected fields to their old values.
  IF current_setting('role') = 'authenticated' THEN
    NEW.role = OLD.role;
    NEW.organization_id = OLD.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_escalation_trigger ON profiles;

CREATE TRIGGER protect_profile_escalation_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_profile_escalation();
