import { useState, useEffect } from 'react';

// Standalone frontend mock for database operations.
// Removes any backend/Supabase dependency while preserving the hook API.
export interface Feeder {
  id: string;
  name: string;
  substation: string;
  voltage_level: string;
  load_percentage: number;
  status: 'ACTIVE' | 'FAULTY' | 'ISOLATED' | 'CURRENT_OFF';
  fault_type?: string | null;
  fault_severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | null;
  is_testing: boolean;
  is_monitoring: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FeederData {
  id?: string;
  feeder_id: string;
  voltage: number;
  current: number;
  power: number;
  frequency: number;
  signal_strength: number;
  temperature: number;
  thd: number;
  fault_current: number;
  timestamp?: string;
}

export interface SystemEvent {
  id?: string;
  feeder_id: string;
  event_type: string;
  event_data: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp?: string;
}

export interface SystemMetrics {
  id?: string;
  total_load: number;
  system_frequency: number;
  total_generation: number;
  system_losses: number;
  power_factor: number;
  peak_demand: number;
  active_feeders: number;
  faulty_feeders: number;
  isolated_feeders: number;
  timestamp?: string;
}

export const useDatabase = () => {
  const [isConnected, setIsConnected] = useState(true);

  // In-memory stores to mimic persistence within a session
  const feedersStore = useState<Record<string, Feeder>>({})[0];
  const feederDataStore = useState<FeederData[]>([])[0];
  const systemEventsStore = useState<SystemEvent[]>([])[0];
  const systemMetricsStore = useState<SystemMetrics[]>([])[0];

  useEffect(() => {
    // For a pure-frontend mock, always report connected
    setIsConnected(true);
  }, []);

  // Initialize feeders in database
  const initializeFeeders = async (feeders: any[]) => {
    try {
      feeders.forEach(feeder => {
        const record: Feeder = {
          id: feeder.id,
          name: feeder.id,
          substation: feeder.substation ?? 'Unknown Substation',
          voltage_level: feeder.voltage ?? '11kV',
          load_percentage: feeder.load,
          status: (feeder.status?.toUpperCase?.() as Feeder['status']) ?? 'ACTIVE',
          fault_type: feeder.faultType ?? null,
          fault_severity: feeder.faultSeverity ?? null,
          is_testing: false,
          is_monitoring: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        feedersStore[record.id] = record;
      });
      // eslint-disable-next-line no-console
      console.log('Feeders initialized (mock)');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initializing feeders (mock):', error);
    }
  };

  // Update feeder status
  const updateFeederStatus = async (feederId: string, updates: Partial<Feeder>) => {
    try {
      const existing = feedersStore[feederId];
      if (existing) {
        feedersStore[feederId] = { ...existing, ...updates, updated_at: new Date().toISOString() };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating feeder status (mock):', error);
    }
  };

  // Store feeder data
  const storeFeederData = async (feederId: string, data: Omit<FeederData, 'id' | 'feeder_id' | 'timestamp'>) => {
    try {
      feederDataStore.push({
        feeder_id: feederId,
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error storing feeder data (mock):', error);
    }
  };

  // Log system event
  const logSystemEvent = async (
    feederId: string,
    eventType: string,
    message: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO',
    eventData: Record<string, any> = {}
  ) => {
    try {
      systemEventsStore.push({
        feeder_id: feederId,
        event_type: eventType,
        message,
        severity,
        event_data: eventData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error logging system event (mock):', error);
    }
  };

  // Store system metrics
  const storeSystemMetrics = async (metrics: Omit<SystemMetrics, 'id' | 'timestamp'>) => {
    try {
      systemMetricsStore.push({ ...metrics, timestamp: new Date().toISOString() });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error storing system metrics (mock):', error);
    }
  };

  // Get recent feeder data
  const getRecentFeederData = async (feederId: string, limit: number = 100) => {
    try {
      return feederDataStore
        .filter(d => d.feeder_id === feederId)
        .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
        .slice(0, limit);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching feeder data (mock):', error);
      return [];
    }
  };

  // Get system events
  const getSystemEvents = async (limit: number = 50) => {
    try {
      return systemEventsStore
        .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
        .slice(0, limit);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching system events (mock):', error);
      return [];
    }
  };

  return {
    isConnected,
    initializeFeeders,
    updateFeederStatus,
    storeFeederData,
    logSystemEvent,
    storeSystemMetrics,
    getRecentFeederData,
    getSystemEvents
  };
};