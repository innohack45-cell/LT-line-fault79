/*
  # Fix Row-Level Security Policies for Anonymous Access

  1. Security Updates
    - Update RLS policies to allow anonymous users to perform operations
    - Enable INSERT, UPDATE, SELECT, DELETE for anon role
    - Maintain security while allowing application functionality

  2. Policy Changes
    - Allow anonymous users to read all data
    - Allow anonymous users to insert new records
    - Allow anonymous users to update existing records
    - Allow anonymous users to delete records if needed
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON feeders;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON feeder_data;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON system_events;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON system_metrics;

-- Create new policies that allow anonymous access for the demo application

-- Feeders table policies
CREATE POLICY "Allow anonymous read access on feeders"
  ON feeders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on feeders"
  ON feeders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on feeders"
  ON feeders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on feeders"
  ON feeders
  FOR DELETE
  TO anon
  USING (true);

-- Feeder data table policies
CREATE POLICY "Allow anonymous read access on feeder_data"
  ON feeder_data
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on feeder_data"
  ON feeder_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on feeder_data"
  ON feeder_data
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on feeder_data"
  ON feeder_data
  FOR DELETE
  TO anon
  USING (true);

-- System events table policies
CREATE POLICY "Allow anonymous read access on system_events"
  ON system_events
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on system_events"
  ON system_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on system_events"
  ON system_events
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on system_events"
  ON system_events
  FOR DELETE
  TO anon
  USING (true);

-- System metrics table policies
CREATE POLICY "Allow anonymous read access on system_metrics"
  ON system_metrics
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on system_metrics"
  ON system_metrics
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on system_metrics"
  ON system_metrics
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on system_metrics"
  ON system_metrics
  FOR DELETE
  TO anon
  USING (true);

-- Also create policies for authenticated users
CREATE POLICY "Allow authenticated read access on feeders"
  ON feeders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on feeders"
  ON feeders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on feeders"
  ON feeders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on feeders"
  ON feeders
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on feeder_data"
  ON feeder_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on feeder_data"
  ON feeder_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on feeder_data"
  ON feeder_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on feeder_data"
  ON feeder_data
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on system_events"
  ON system_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on system_events"
  ON system_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on system_events"
  ON system_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on system_events"
  ON system_events
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on system_metrics"
  ON system_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on system_metrics"
  ON system_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on system_metrics"
  ON system_metrics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on system_metrics"
  ON system_metrics
  FOR DELETE
  TO authenticated
  USING (true);