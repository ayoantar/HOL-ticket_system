-- Migration to add tech_activities table for tech activity logging
-- This table tracks all activities performed by technicians on tickets
-- without modifying the original ticket content

CREATE TABLE IF NOT EXISTS tech_activities (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tech_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('status_change', 'internal_note', 'work_started', 'work_completed', 'info_requested', 'escalated')),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  notes TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent INTEGER, -- Time spent in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tech_activities_ticket_id ON tech_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tech_activities_tech_id ON tech_activities(tech_id);
CREATE INDEX IF NOT EXISTS idx_tech_activities_created_at ON tech_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_tech_activities_activity_type ON tech_activities(activity_type);

-- Add comments for documentation
COMMENT ON TABLE tech_activities IS 'Tracks all activities performed by technicians on tickets';
COMMENT ON COLUMN tech_activities.activity_type IS 'Type of activity: status_change, internal_note, work_started, work_completed, info_requested, escalated';
COMMENT ON COLUMN tech_activities.is_internal IS 'Whether this activity is internal only (not visible to client)';
COMMENT ON COLUMN tech_activities.time_spent IS 'Time spent on this activity in minutes';
COMMENT ON COLUMN tech_activities.old_status IS 'Previous status for status_change activities';
COMMENT ON COLUMN tech_activities.new_status IS 'New status for status_change activities';