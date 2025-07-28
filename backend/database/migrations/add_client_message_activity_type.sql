-- Drop the existing check constraint
ALTER TABLE request_activities DROP CONSTRAINT request_activities_activity_type_check;

-- Add new check constraint with client_message included
ALTER TABLE request_activities ADD CONSTRAINT request_activities_activity_type_check 
CHECK (activity_type::text = ANY (ARRAY['status_change'::character varying, 'internal_note'::character varying, 'client_message'::character varying, 'work_started'::character varying, 'work_completed'::character varying, 'info_requested'::character varying, 'escalated'::character varying]::text[]));