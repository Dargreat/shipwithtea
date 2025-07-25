-- Disable email confirmation for development
-- This allows users to sign in immediately without email confirmation
UPDATE auth.config SET enable_signup = true, enable_confirmations = false;