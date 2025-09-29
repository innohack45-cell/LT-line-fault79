/*
  # Smart Grid Monitoring Database Schema

  1. New Tables
    - `feeders`
      - `id` (text, primary key) - Feeder ID (F-001, F-002, etc.)
      - `name` (text) - Feeder name
      - `substation` (text) - Connected substation
      - `voltage_level` (text) - Voltage level (33kV, 11kV, etc.)
      - `load_percentage` (integer) - Current load percentage
      - `status` (text) - ACTIVE, FAULTY, ISOLATED, CURRENT_OFF
      - `fault_type` (text) - Type of fault if any
      - `fault_severity` (text) - CRITICAL, MAJOR, MINOR
      - `is_testing` (boolean) - Testing mode status
      - `is_monitoring` (boolean) - Enhanced monitoring status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `feeder_data`
      - `id` (uuid, primary key)
      - `feeder_id` (text, foreign key)
      - `voltage` (numeric) - Voltage reading
      - `current` (numeric) - Current reading
      - `power` (numeric) - Power reading
      - `frequency` (numeric) - Frequency reading
      - `signal_strength` (integer) - Signal strength percentage
      - `temperature` (numeric) - Equipment temperature
      - `thd` (numeric) - Total Harmonic Distortion
      - `fault_current` (numeric) - Fault current if any
      - `timestamp` (timestamp)

    - `system_events`
      - `id` (uuid, primary key)
      - `feeder_id` (text, foreign key)
      - `event_type` (text) - FAULT_DETECTED, CURRENT_OFF, TESTING_START, etc.
      - `event_data` (jsonb) - Additional event data
      - `severity` (text) - INFO, WARNING, CRITICAL
      - `message` (text) - Event description
      - `timestamp` (timestamp)

    - `system_metrics`
      - `id` (uuid, primary key)
      - `total_load` (numeric) - System total load
      - `system_frequency` (numeric) - System frequency
      - `total_generation` (numeric) - Total generation
      - `system_losses` (numeric) - System losses percentage
      - `power_factor` (numeric) - System power factor
      - `peak_demand` (numeric) - Peak demand
      - `active_feeders` (integer) - Number of active feeders
      - `faulty_feeders` (integer) - Number of faulty feeders
      - `isolated_feeders` (integer) - Number of isolated feeders
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write data
*/

-- Create feeders table
CREATE TABLE IF NOT EXISTS feeders (
  id text PRIMARY KEY,
  name text NOT NULL,
  substation text NOT NULL,
  voltage_level text NOT NULL,
  load_percentage integer DEFAULT 0,
  status text DEFAULT 'ACTIVE',
  fault_type text,
  fault_severity text,
  is_testing boolean DEFAULT false,
  is_monitoring boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feeder_data table
CREATE TABLE IF NOT EXISTS feeder_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feeder_id text REFERENCES feeders(id) ON DELETE CASCADE,
  voltage numeric DEFAULT 0,
  current numeric DEFAULT 0,
  power numeric DEFAULT 0,
  frequency numeric DEFAULT 50.0,
  signal_strength integer DEFAULT 100,
  temperature numeric DEFAULT 25.0,
  thd numeric DEFAULT 0,
  fault_current numeric DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

-- Create system_events table
CREATE TABLE IF NOT EXISTS system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feeder_id text REFERENCES feeders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  severity text DEFAULT 'INFO',
  message text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_load numeric DEFAULT 0,
  system_frequency numeric DEFAULT 50.0,
  total_generation numeric DEFAULT 0,
  system_losses numeric DEFAULT 0,
  power_factor numeric DEFAULT 0.95,
  peak_demand numeric DEFAULT 0,
  active_feeders integer DEFAULT 0,
  faulty_feeders integer DEFAULT 0,
  isolated_feeders integer DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE feeders ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeder_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON feeders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON feeder_data
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON system_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON system_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feeder_data_feeder_id ON feeder_data(feeder_id);
CREATE INDEX IF NOT EXISTS idx_feeder_data_timestamp ON feeder_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_feeder_id ON system_events(feeder_id);
CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for feeders table
CREATE TRIGGER update_feeders_updated_at
  BEFORE UPDATE ON feeders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();