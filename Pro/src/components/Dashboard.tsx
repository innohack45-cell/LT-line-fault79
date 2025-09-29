import { useState, useEffect } from 'react';
import { Zap, CheckCircle, XCircle, Home, Activity, MapPin, Settings, Wifi, WifiOff, Shield, Eye, BarChart3, TrendingUp, Database, Signal } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';

interface FaultLocation {
  id: string;
  x: number;
  y: number;
  type: 'line_break';
  severity: 'critical' | 'major' | 'minor';
  feeder: string;
  status: 'active' | 'isolated' | 'monitoring' | 'resolved';
  detectedAt: string;
  isolatedAt?: string;
  description: string;
}

interface Substation {
  id: string;
  name: string;
  voltage: string;
  x: number;
  y: number;
  status: 'online' | 'offline';
  type: 'main' | 'distribution' | 'feeder';
}

interface Feeder {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  status: 'active' | 'faulty' | 'isolated' | 'maintenance';
  color: string;
  voltage: string;
  load: number;
}

const Dashboard = () => {
  const [selectedFault, setSelectedFault] = useState<FaultLocation | null>(null);
  const [notification, setNotification] = useState<string>('');
  const {
    isConnected,
    initializeFeeders,
    updateFeederStatus,
    logSystemEvent
  } = useDatabase();
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [showDataPanel, setShowDataPanel] = useState<boolean>(false);
  const [realTimeData, setRealTimeData] = useState<any>({});
  const [selectedFeederId, setSelectedFeederId] = useState<string | null>(null);
  const FAULT_MARKER_RADIUS = 12;
  const FAULT_MARKER_OUTER = 16;
  // Map any feeder id (e.g., F-001..F-038) to logical LT Feeder 1/2/3
  const getFeederGroupFromId = (feederId: string): 1 | 2 | 3 => {
    // Explicitly handle the three LT feeders (F-001/F-002/F-003)
    if (/^F-?0*01$/.test(feederId)) return 1;
    if (/^F-?0*02$/.test(feederId)) return 2;
    if (/^F-?0*03$/.test(feederId)) return 3;
    // Fallback for legacy IDs with larger ranges
    const match = feederId.match(/(\d+)/);
    const n = match ? parseInt(match[1], 10) : 1;
    const mod = ((n - 1) % 3) + 1; // 1..3 round-robin
    return mod as 1 | 2 | 3;
  };
  const displayFeederGroup = (feederId: string) => `LT Feeder ${getFeederGroupFromId(feederId)}`;
  // smartMeters will be defined after houses are generated
  const [faultLocations, setFaultLocations] = useState<FaultLocation[]>([
    { 
      id: 'fault-1', 
      x: 365, 
      y: 375, 
      type: 'line_break', 
      severity: 'critical',
      feeder: 'F-006', 
      status: 'active',
      detectedAt: '14:32:15',
      description: 'Complete line breakage detected on feeder branch F-006'
    },
  ]);

  const showNotification = (message: string) => {
    setNotification(message);
    setLastUpdate(new Date().toLocaleTimeString());
    setTimeout(() => setNotification(''), 4000);
  };

  const substations: Substation[] = [
    { id: 'main', name: 'Distribution Transformer', voltage: '132kV', x: 550, y: 100, status: 'online', type: 'main' },
    { id: 'it1', name: 'LT Feeder 1', voltage: '33kV', x: 300, y: 250, status: 'online', type: 'distribution' },
    { id: 'it2', name: 'LT Feeder 2', voltage: '33kV', x: 550, y: 250, status: 'online', type: 'distribution' },
    { id: 'it3', name: 'LT Feeder 3', voltage: '33kV', x: 800, y: 250, status: 'online', type: 'distribution' }
  ];

  const [feeders, setFeeders] = useState<Feeder[]>([
    // Main connections from Distribution Transformer to IT Feeders
    {
      id: 'F-001',
      name: 'F-001',
      points: [{ x: 550, y: 100 }, { x: 300, y: 250 }],
      status: 'active',
      color: '#10b981',
      voltage: '33kV',
      load: 85
    },
    {
      id: 'F-002',
      name: 'F-002',
      points: [{ x: 550, y: 100 }, { x: 550, y: 250 }],
      status: 'active',
      color: '#10b981',
      voltage: '33kV',
      load: 90
    },
    {
      id: 'F-003',
      name: 'F-003',
      points: [{ x: 550, y: 100 }, { x: 800, y: 250 }],
      status: 'active',
      color: '#10b981',
      voltage: '33kV',
      load: 88
    },
    
    // IT Feeder 1 - Extended branching pattern with more branches
    {
      id: 'F-004',
      name: 'F-004',
      points: [{ x: 300, y: 250 }, { x: 250, y: 300 }, { x: 200, y: 350 }, { x: 150, y: 400 }, { x: 100, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 72
    },
    {
      id: 'F-005',
      name: 'F-005',
      points: [{ x: 300, y: 250 }, { x: 280, y: 300 }, { x: 250, y: 350 }, { x: 220, y: 400 }, { x: 180, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 75
    },
    {
      id: 'F-006',
      name: 'F-006',
      points: [{ x: 300, y: 250 }, { x: 320, y: 300 }, { x: 350, y: 350 }, { x: 380, y: 400 }, { x: 420, y: 450 }],
      status: 'faulty',
      color: '#ef4444',
      voltage: '11kV',
      load: 0
    },
    {
      id: 'F-007',
      name: 'F-007',
      points: [{ x: 300, y: 250 }, { x: 250, y: 300 }, { x: 200, y: 350 }, { x: 150, y: 400 }, { x: 100, y: 500 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 70
    },
    {
      id: 'F-008',
      name: 'F-008',
      points: [{ x: 300, y: 250 }, { x: 320, y: 300 }, { x: 340, y: 350 }, { x: 360, y: 400 }, { x: 380, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 68
    },
    {
      id: 'F-009',
      name: 'F-009',
      points: [{ x: 300, y: 250 }, { x: 280, y: 300 }, { x: 260, y: 350 }, { x: 240, y: 400 }, { x: 220, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 69
    },
    {
      id: 'F-010',
      name: 'F-010',
      points: [{ x: 300, y: 250 }, { x: 320, y: 300 }, { x: 340, y: 350 }, { x: 360, y: 400 }, { x: 380, y: 500 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 76
    },
    {
      id: 'F-011',
      name: 'F-011',
      points: [{ x: 300, y: 250 }, { x: 250, y: 300 }, { x: 200, y: 350 }, { x: 150, y: 400 }, { x: 100, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 73
    },
    {
      id: 'F-012',
      name: 'F-012',
      points: [{ x: 300, y: 250 }, { x: 320, y: 300 }, { x: 340, y: 350 }, { x: 360, y: 400 }, { x: 380, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 71
    },
    {
      id: 'F-013',
      name: 'F-013',
      points: [{ x: 300, y: 250 }, { x: 280, y: 300 }, { x: 260, y: 350 }, { x: 240, y: 400 }, { x: 220, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 74
    },
    {
      id: 'F-014',
      name: 'F-014',
      points: [{ x: 300, y: 250 }, { x: 250, y: 300 }, { x: 200, y: 350 }, { x: 150, y: 400 }, { x: 100, y: 600 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 72
    },
    
    // IT Feeder 2 - Extended branching pattern with more branches
    {
      id: 'F-015',
      name: 'F-015',
      points: [{ x: 550, y: 250 }, { x: 500, y: 300 }, { x: 450, y: 350 }, { x: 400, y: 400 }, { x: 350, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 80
    },
    {
      id: 'F-016',
      name: 'F-016',
      points: [{ x: 550, y: 250 }, { x: 550, y: 300 }, { x: 550, y: 350 }, { x: 550, y: 400 }, { x: 550, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 85
    },
    {
      id: 'F-017',
      name: 'F-017',
      points: [{ x: 550, y: 250 }, { x: 600, y: 300 }, { x: 650, y: 350 }, { x: 700, y: 400 }, { x: 750, y: 450 }],
      status: 'faulty',
      color: '#ef4444',
      voltage: '11kV',
      load: 0
    },
    {
      id: 'F-018',
      name: 'F-018',
      points: [{ x: 550, y: 250 }, { x: 500, y: 300 }, { x: 480, y: 350 }, { x: 460, y: 400 }, { x: 440, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 73
    },
    {
      id: 'F-019',
      name: 'F-019',
      points: [{ x: 550, y: 250 }, { x: 600, y: 300 }, { x: 620, y: 350 }, { x: 640, y: 400 }, { x: 660, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 77
    },
    {
      id: 'F-020',
      name: 'F-020',
      points: [{ x: 550, y: 250 }, { x: 550, y: 300 }, { x: 500, y: 350 }, { x: 450, y: 400 }, { x: 400, y: 500 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 78
    },
    {
      id: 'F-021',
      name: 'F-021',
      points: [{ x: 550, y: 250 }, { x: 520, y: 300 }, { x: 480, y: 350 }, { x: 440, y: 400 }, { x: 400, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 75
    },
    {
      id: 'F-022',
      name: 'F-022',
      points: [{ x: 550, y: 250 }, { x: 580, y: 300 }, { x: 620, y: 350 }, { x: 660, y: 400 }, { x: 700, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 76
    },
    {
      id: 'F-023',
      name: 'F-023',
      points: [{ x: 550, y: 250 }, { x: 500, y: 300 }, { x: 450, y: 350 }, { x: 400, y: 400 }, { x: 350, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 74
    },
    {
      id: 'F-024',
      name: 'F-024',
      points: [{ x: 550, y: 250 }, { x: 600, y: 300 }, { x: 650, y: 350 }, { x: 700, y: 400 }, { x: 750, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 72
    },
    {
      id: 'F-025',
      name: 'F-025',
      points: [{ x: 550, y: 250 }, { x: 550, y: 300 }, { x: 500, y: 350 }, { x: 450, y: 400 }, { x: 400, y: 600 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 71
    },
    {
      id: 'F-026',
      name: 'F-026',
      points: [{ x: 550, y: 250 }, { x: 520, y: 300 }, { x: 480, y: 350 }, { x: 440, y: 400 }, { x: 400, y: 600 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 73
    },
    
    // IT Feeder 3 - Extended branching pattern with more branches
    {
      id: 'F-027',
      name: 'F-027',
      points: [{ x: 800, y: 250 }, { x: 750, y: 300 }, { x: 700, y: 350 }, { x: 650, y: 400 }, { x: 600, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 82
    },
    {
      id: 'F-028',
      name: 'F-028',
      points: [{ x: 800, y: 250 }, { x: 800, y: 300 }, { x: 800, y: 350 }, { x: 800, y: 400 }, { x: 800, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 85
    },
    {
      id: 'F-029',
      name: 'F-029',
      points: [{ x: 800, y: 250 }, { x: 850, y: 300 }, { x: 900, y: 350 }, { x: 950, y: 400 }, { x: 1000, y: 450 }],
      status: 'faulty',
      color: '#ef4444',
      voltage: '11kV',
      load: 0
    },
    {
      id: 'F-030',
      name: 'F-030',
      points: [{ x: 800, y: 250 }, { x: 750, y: 300 }, { x: 720, y: 350 }, { x: 690, y: 400 }, { x: 660, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 79
    },
    {
      id: 'F-031',
      name: 'F-031',
      points: [{ x: 800, y: 250 }, { x: 850, y: 300 }, { x: 880, y: 350 }, { x: 910, y: 400 }, { x: 940, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 77
    },
    {
      id: 'F-032',
      name: 'F-032',
      points: [{ x: 800, y: 250 }, { x: 800, y: 300 }, { x: 750, y: 350 }, { x: 700, y: 400 }, { x: 650, y: 500 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 76
    },
    {
      id: 'F-033',
      name: 'F-033',
      points: [{ x: 800, y: 250 }, { x: 760, y: 300 }, { x: 720, y: 350 }, { x: 680, y: 400 }, { x: 640, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 74
    },
    {
      id: 'F-034',
      name: 'F-034',
      points: [{ x: 800, y: 250 }, { x: 840, y: 300 }, { x: 880, y: 350 }, { x: 920, y: 400 }, { x: 960, y: 450 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 78
    },
    {
      id: 'F-035',
      name: 'F-035',
      points: [{ x: 800, y: 250 }, { x: 750, y: 300 }, { x: 700, y: 350 }, { x: 650, y: 400 }, { x: 600, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 75
    },
    {
      id: 'F-036',
      name: 'F-036',
      points: [{ x: 800, y: 250 }, { x: 850, y: 300 }, { x: 900, y: 350 }, { x: 950, y: 400 }, { x: 1000, y: 550 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 73
    },
    {
      id: 'F-037',
      name: 'F-037',
      points: [{ x: 800, y: 250 }, { x: 800, y: 300 }, { x: 750, y: 350 }, { x: 700, y: 400 }, { x: 650, y: 600 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 71
    },
    {
      id: 'F-038',
      name: 'F-038',
      points: [{ x: 800, y: 250 }, { x: 760, y: 300 }, { x: 720, y: 350 }, { x: 680, y: 400 }, { x: 640, y: 600 }],
      status: 'active',
      color: '#10b981',
      voltage: '11kV',
      load: 72
    }
  ]);

  // Generate smart meters in dedicated residential areas (inline via SSG elsewhere)
  // Removed unused helper to satisfy linter
  /* const generateHouses = () => {
    const houses: any[] = [];
    
    // Define residential areas along feeder branches - Houses placed on lines
    const residentialAreas = [
      // IT Feeder 1 branches - Houses along the lines
      { centerX: 175, centerY: 325, count: 4, feeder: 'F-004' }, // Along F-004 line
      { centerX: 125, centerY: 375, count: 3, feeder: 'F-004' },
      { centerX: 75, centerY: 425, count: 3, feeder: 'F-004' },
      
      { centerX: 265, centerY: 325, count: 4, feeder: 'F-005' }, // Along F-005 line
      { centerX: 235, centerY: 375, count: 3, feeder: 'F-005' },
      { centerX: 200, centerY: 425, count: 3, feeder: 'F-005' },
      
      { centerX: 335, centerY: 325, count: 4, feeder: 'F-006' }, // Along F-006 line
      { centerX: 365, centerY: 375, count: 3, feeder: 'F-006' },
      { centerX: 400, centerY: 425, count: 3, feeder: 'F-006' },
      
      { centerX: 175, centerY: 325, count: 3, feeder: 'F-007' }, // Along F-007 line
      { centerX: 125, centerY: 375, count: 3, feeder: 'F-007' },
      { centerX: 75, centerY: 450, count: 3, feeder: 'F-007' },
      
      { centerX: 330, centerY: 325, count: 3, feeder: 'F-008' }, // Along F-008 line
      { centerX: 350, centerY: 375, count: 3, feeder: 'F-008' },
      { centerX: 370, centerY: 425, count: 3, feeder: 'F-008' },
      
      { centerX: 270, centerY: 325, count: 3, feeder: 'F-009' }, // Along F-009 line
      { centerX: 250, centerY: 375, count: 3, feeder: 'F-009' },
      { centerX: 230, centerY: 425, count: 3, feeder: 'F-009' },
      
      { centerX: 330, centerY: 325, count: 3, feeder: 'F-010' }, // Along F-010 line
      { centerX: 350, centerY: 375, count: 3, feeder: 'F-010' },
      { centerX: 370, centerY: 450, count: 3, feeder: 'F-010' },
      
      { centerX: 175, centerY: 325, count: 3, feeder: 'F-011' }, // Along F-011 line
      { centerX: 125, centerY: 375, count: 3, feeder: 'F-011' },
      { centerX: 75, centerY: 525, count: 3, feeder: 'F-011' },
      
      { centerX: 330, centerY: 325, count: 3, feeder: 'F-012' }, // Along F-012 line
      { centerX: 350, centerY: 375, count: 3, feeder: 'F-012' },
      { centerX: 370, centerY: 525, count: 3, feeder: 'F-012' },
      
      { centerX: 270, centerY: 325, count: 3, feeder: 'F-013' }, // Along F-013 line
      { centerX: 250, centerY: 375, count: 3, feeder: 'F-013' },
      { centerX: 230, centerY: 525, count: 3, feeder: 'F-013' },
      
      { centerX: 175, centerY: 325, count: 3, feeder: 'F-014' }, // Along F-014 line
      { centerX: 125, centerY: 375, count: 3, feeder: 'F-014' },
      { centerX: 75, centerY: 575, count: 3, feeder: 'F-014' },
      
      // IT Feeder 2 branches - Houses along the lines
      { centerX: 475, centerY: 325, count: 4, feeder: 'F-015' }, // Along F-015 line
      { centerX: 425, centerY: 375, count: 3, feeder: 'F-015' },
      { centerX: 375, centerY: 425, count: 3, feeder: 'F-015' },
      
      { centerX: 550, centerY: 325, count: 4, feeder: 'F-016' }, // Along F-016 line
      { centerX: 550, centerY: 375, count: 3, feeder: 'F-016' },
      { centerX: 550, centerY: 425, count: 3, feeder: 'F-016' },
      
      { centerX: 625, centerY: 325, count: 4, feeder: 'F-017' }, // Along F-017 line
      { centerX: 675, centerY: 375, count: 3, feeder: 'F-017' },
      { centerX: 725, centerY: 425, count: 3, feeder: 'F-017' },
      
      { centerX: 475, centerY: 325, count: 3, feeder: 'F-018' }, // Along F-018 line
      { centerX: 470, centerY: 375, count: 3, feeder: 'F-018' },
      { centerX: 450, centerY: 425, count: 3, feeder: 'F-018' },
      
      { centerX: 625, centerY: 325, count: 3, feeder: 'F-019' }, // Along F-019 line
      { centerX: 635, centerY: 375, count: 3, feeder: 'F-019' },
      { centerX: 655, centerY: 425, count: 3, feeder: 'F-019' },
      
      { centerX: 550, centerY: 325, count: 3, feeder: 'F-020' }, // Along F-020 line
      { centerX: 525, centerY: 375, count: 3, feeder: 'F-020' },
      { centerX: 475, centerY: 450, count: 3, feeder: 'F-020' },
      
      { centerX: 535, centerY: 325, count: 3, feeder: 'F-021' }, // Along F-021 line
      { centerX: 500, centerY: 375, count: 3, feeder: 'F-021' },
      { centerX: 420, centerY: 425, count: 3, feeder: 'F-021' },
      
      { centerX: 590, centerY: 325, count: 3, feeder: 'F-022' }, // Along F-022 line
      { centerX: 630, centerY: 375, count: 3, feeder: 'F-022' },
      { centerX: 670, centerY: 425, count: 3, feeder: 'F-022' },
      
      { centerX: 475, centerY: 325, count: 3, feeder: 'F-023' }, // Along F-023 line
      { centerX: 425, centerY: 375, count: 3, feeder: 'F-023' },
      { centerX: 375, centerY: 525, count: 3, feeder: 'F-023' },
      
      { centerX: 625, centerY: 325, count: 3, feeder: 'F-024' }, // Along F-024 line
      { centerX: 675, centerY: 375, count: 3, feeder: 'F-024' },
      { centerX: 725, centerY: 525, count: 3, feeder: 'F-024' },
      
      { centerX: 550, centerY: 325, count: 3, feeder: 'F-025' }, // Along F-025 line
      { centerX: 525, centerY: 375, count: 3, feeder: 'F-025' },
      { centerX: 475, centerY: 575, count: 3, feeder: 'F-025' },
      
      { centerX: 535, centerY: 325, count: 3, feeder: 'F-026' }, // Along F-026 line
      { centerX: 500, centerY: 375, count: 3, feeder: 'F-026' },
      { centerX: 420, centerY: 575, count: 3, feeder: 'F-026' },
      
      // IT Feeder 3 branches - Houses along the lines
      { centerX: 775, centerY: 325, count: 4, feeder: 'F-027' }, // Along F-027 line
      { centerX: 725, centerY: 375, count: 3, feeder: 'F-027' },
      { centerX: 675, centerY: 425, count: 3, feeder: 'F-027' },
      
      { centerX: 800, centerY: 325, count: 4, feeder: 'F-028' }, // Along F-028 line
      { centerX: 800, centerY: 375, count: 3, feeder: 'F-028' },
      { centerX: 800, centerY: 425, count: 3, feeder: 'F-028' },
      
      { centerX: 825, centerY: 325, count: 4, feeder: 'F-029' }, // Along F-029 line
      { centerX: 875, centerY: 375, count: 3, feeder: 'F-029' },
      { centerX: 925, centerY: 425, count: 3, feeder: 'F-029' },
      
      { centerX: 775, centerY: 325, count: 3, feeder: 'F-030' }, // Along F-030 line
      { centerX: 735, centerY: 375, count: 3, feeder: 'F-030' },
      { centerX: 705, centerY: 425, count: 3, feeder: 'F-030' },
      
      { centerX: 825, centerY: 325, count: 3, feeder: 'F-031' }, // Along F-031 line
      { centerX: 865, centerY: 375, count: 3, feeder: 'F-031' },
      { centerX: 905, centerY: 425, count: 3, feeder: 'F-031' },
      
      { centerX: 800, centerY: 325, count: 3, feeder: 'F-032' }, // Along F-032 line
      { centerX: 775, centerY: 375, count: 3, feeder: 'F-032' },
      { centerX: 725, centerY: 475, count: 3, feeder: 'F-032' },
      
      { centerX: 780, centerY: 325, count: 3, feeder: 'F-033' }, // Along F-033 line
      { centerX: 740, centerY: 375, count: 3, feeder: 'F-033' },
      { centerX: 680, centerY: 425, count: 3, feeder: 'F-033' },
      
      { centerX: 820, centerY: 325, count: 3, feeder: 'F-034' }, // Along F-034 line
      { centerX: 860, centerY: 375, count: 3, feeder: 'F-034' },
      { centerX: 900, centerY: 425, count: 3, feeder: 'F-034' },
      
      { centerX: 775, centerY: 325, count: 3, feeder: 'F-035' }, // Along F-035 line
      { centerX: 725, centerY: 375, count: 3, feeder: 'F-035' },
      { centerX: 675, centerY: 525, count: 3, feeder: 'F-035' },
      
      { centerX: 825, centerY: 325, count: 3, feeder: 'F-036' }, // Along F-036 line
      { centerX: 875, centerY: 375, count: 3, feeder: 'F-036' },
      { centerX: 925, centerY: 525, count: 3, feeder: 'F-036' },
      
      { centerX: 800, centerY: 325, count: 3, feeder: 'F-037' }, // Along F-037 line
      { centerX: 775, centerY: 375, count: 3, feeder: 'F-037' },
      { centerX: 725, centerY: 575, count: 3, feeder: 'F-037' },
      
      { centerX: 780, centerY: 325, count: 3, feeder: 'F-038' }, // Along F-038 line
      { centerX: 740, centerY: 375, count: 3, feeder: 'F-038' },
      { centerX: 680, centerY: 575, count: 3, feeder: 'F-038' }
    ];
    
    residentialAreas.forEach(area => {
      for (let i = 0; i < area.count; i++) {
        // Generate houses in a more natural cluster pattern
        const angle = (i / area.count) * 2 * Math.PI + Math.random() * 0.5;
        const radius = 15 + Math.random() * 25;
        const x = area.centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20;
        const y = area.centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20;
        
        // Find the corresponding feeder to check status
        const feeder = feeders.find(f => f.id === area.feeder);
        const isOnline = feeder ? feeder.status === 'active' : true;
          
          houses.push({
            x,
            y,
            status: isOnline ? 'online' : 'offline',
          feeder: area.feeder
          });
      }
    });
    
    return houses;
  }; */

  // Place exactly 30 houses along the three LT feeders (12/9/9) without changing map geometry
  const pickPointOnFeeder = (feederId: string, placeAfterEnd: boolean = false) => {
    const feeder = feeders.find(f => f.id === feederId);
    if (!feeder) return { x: 0, y: 0 };
    const useLastSegment = placeAfterEnd && feeder.points.length >= 2;
    const idx = useLastSegment ? feeder.points.length - 2 : Math.max(0, Math.min(feeder.points.length - 2, Math.floor(Math.random() * (feeder.points.length - 1))));
    const a = feeder.points[idx];
    const b = feeder.points[idx + 1];
    if (useLastSegment) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const extend = 60 + Math.random() * 80; // place beyond end
      const jitterX = (Math.random() - 0.5) * 20;
      const jitterY = (Math.random() - 0.5) * 10;
      return { x: b.x + ux * extend + jitterX, y: b.y + uy * extend + 25 + jitterY };
    }
    const t = Math.random();
    return { x: a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 20, y: a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 20 };
  };
  // Helper: smart meter feeder mapping (12/9/9) to compute per-feeder offline counts without referencing smartMeters
  const getSmartMeterFeeder = (indexOneBased: number): 'F-001' | 'F-002' | 'F-003' => {
    return indexOneBased <= 12 ? 'F-001' : indexOneBased <= 21 ? 'F-002' : 'F-003';
  };
  const offlineSetForMeters = new Set(['SM-005','SM-007','SM-010','SM-012','SM-015','SM-018','SM-020','SM-025']);
  const offlineByFeederPrecalc: Record<string, number> = { 'F-001': 0, 'F-002': 0, 'F-003': 0 };
  for (let k = 1; k <= 30; k++) {
    const id = `SM-${String(k).padStart(3, '0')}`;
    if (offlineSetForMeters.has(id)) {
      const fid = getSmartMeterFeeder(k);
      offlineByFeederPrecalc[fid]++;
    }
  }
  const houses = (() => {
    const counts: Record<string, number> = { 'F-001': 12, 'F-002': 9, 'F-003': 9 };
    const out: any[] = [];
    (Object.keys(counts) as Array<'F-001' | 'F-002' | 'F-003'>).forEach(fid => {
      for (let i = 0; i < counts[fid]; i++) {
        // Place after the end of the feeder so houses appear downstream
        const p = pickPointOnFeeder(fid, true);
        out.push({ x: p.x, y: p.y, status: 'online', feeder: fid });
      }
    });
    // Make house offline distribution match precomputed offline smart meters per feeder
    (Object.keys(offlineByFeederPrecalc) as Array<'F-001' | 'F-002' | 'F-003'>).forEach(fid => {
      let need = offlineByFeederPrecalc[fid];
      for (let i = 0; i < out.length && need > 0; i++) {
        if (out[i].feeder === fid && out[i].status === 'online') { out[i].status = 'offline'; need--; }
      }
    });
    return out;
  })();

  // Smart meters data (30) associated to a feeder from generated houses
  const smartMeters = (() => {
    // Static offline range 5-10: choose 8 for now (can be tuned to 5–10)
    const offlineSet = new Set(['SM-005','SM-007','SM-010','SM-012','SM-015','SM-018','SM-020','SM-025']);
    const meters: { id: string; voltage: number; current: number; online: boolean; feederId: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const id = `SM-${String(i + 1).padStart(3, '0')}`;
      const isOnline = !offlineSet.has(id);
      // Map: 1–12 -> F-001, 13–21 -> F-002, 22–30 -> F-003 (12/9/9)
      const indexOneBased = i + 1;
      const feederId = indexOneBased <= 12 ? 'F-001' : indexOneBased <= 21 ? 'F-002' : 'F-003';
      meters.push({
        id,
        voltage: isOnline ? 230 + (Math.random() * 10 - 5) : 0,
        current: isOnline ? 5 + Math.random() * 15 : 0,
        online: isOnline,
        feederId
      });
    }
    return meters;
  })();
  // Simulate real-time electrical data
  useEffect(() => {
    // Initialize feeders in database
    if (isConnected) {
      console.log('Database connected, initializing feeders...');
      initializeFeeders(Object.values(feeders));
    }

    const interval = setInterval(() => {
      const newData: any = {};
      
      // Generate data for each feeder
      feeders.forEach(feeder => {
        const baseVoltage = feeder.voltage === '33kV' ? 33000 : 11000;
        const isHealthy = feeder.status === 'active';
        const isFaulty = feeder.status === 'faulty';
        const isIsolated = feeder.status === 'isolated';
        
        newData[feeder.id] = {
          voltage: isIsolated ? 0 : isHealthy ? 
            baseVoltage + (Math.random() - 0.5) * 500 : 
            baseVoltage * (0.7 + Math.random() * 0.2),
          current: isIsolated ? 0 : isHealthy ? 
            feeder.load * 2 + (Math.random() - 0.5) * 10 : 
            feeder.load * 3 + Math.random() * 50,
          power: isIsolated ? 0 : isHealthy ? 
            feeder.load * 100 + (Math.random() - 0.5) * 50 : 
            feeder.load * 80 + Math.random() * 100,
          frequency: isIsolated ? 0 : isHealthy ? 
            50 + (Math.random() - 0.5) * 0.2 : 
            50 + (Math.random() - 0.5) * 2,
          thd: isHealthy ? Math.random() * 3 : Math.random() * 15,
          temperature: 25 + Math.random() * 15,
          signalStrength: isIsolated ? 0 : 85 + Math.random() * 15,
          lastGasp: isFaulty ? Math.floor(Math.random() * 10) : 0,
          faultCurrent: isFaulty ? 500 + Math.random() * 1000 : 0
        };
      });
      
      // System-wide metrics
      newData.system = {
        totalLoad: feeders.reduce((sum, f) => sum + (f.status === 'active' ? f.load : 0), 0),
        systemFrequency: 50 + (Math.random() - 0.5) * 0.1,
        totalGeneration: 2500 + Math.random() * 200,
        systemLosses: 3.2 + Math.random() * 0.8,
        powerFactor: 0.92 + Math.random() * 0.06,
        peakDemand: 2200 + Math.random() * 100
      };
      
      setRealTimeData(newData);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [feeders]);
  const getFaultIcon = (fault: FaultLocation) => {
    switch (fault.status) {
      case 'isolated':
        return '🛡️';
      case 'monitoring':
        return '📊';
      case 'resolved':
        return '✅';
      default:
        return '⚡';
    }
  };

  const getFaultColor = (fault: FaultLocation) => {
    switch (fault.status) {
      case 'isolated':
        return '#6b7280';
      case 'monitoring':
        return '#3b82f6';
      case 'resolved':
        return '#10b981';
      default:
        return fault.severity === 'critical' ? '#dc2626' : fault.severity === 'major' ? '#ea580c' : '#f59e0b';
    }
  };

  const getFaultTypeLabel = (type: string) => {
    switch (type) {
      case 'line_break':
        return 'Line Break';
      default:
        return 'Unknown';
    }
  };

  const handleFaultClick = (fault: FaultLocation) => {
    if (fault.status !== 'resolved') {
      setSelectedFault(fault);
    }
  };

  const ensureFaultForFeeder = (feederId: string) => {
    const found = faultLocations.find(f => f.feeder === feederId && f.status !== 'resolved');
    if (found) return found;
    const feeder = feeders.find(f => f.id === feederId);
    const fullBreak = (feeder?.load ?? 0) === 0;
    const midIndex = feeder ? Math.floor((feeder.points.length - 1) / 2) : 0;
    const mid = feeder ? feeder.points[midIndex] : { x: 0, y: 0 };
    const newFault: FaultLocation = {
      id: `fault-${feederId.toLowerCase()}`,
      x: mid.x,
      y: mid.y,
      type: fullBreak ? 'line_break' : 'line_break',
      severity: fullBreak ? 'critical' : 'major',
      feeder: feederId,
      status: 'active',
      detectedAt: new Date().toLocaleTimeString(),
      description: fullBreak ? `Complete line breakage detected on feeder ${feederId}` : `Partial break detected on feeder ${feederId}`
    };
    setFaultLocations(prev => [...prev.filter(f => !(f.id === newFault.id)), newFault]);
    return newFault;
  };

  const isolateFeederOnMap = async (feederId: string) => {
    try {
      setFeeders(prev => prev.map(f => f.id === feederId ? { ...f, status: 'isolated', color: '#6b7280', load: 0 } : f));
      setSelectedFeederId(null);
      setLastUpdate(new Date().toLocaleTimeString());
      showNotification(`${feederId} isolated from map control`);
      await updateFeederStatus(feederId, { status: 'ISOLATED' });
      await logSystemEvent(feederId, 'MANUAL_ISOLATION', `${feederId} manually isolated from map`, 'INFO', {});
    } catch (error) {
      console.error('Isolation failed:', error);
      showNotification(`Error isolating ${feederId}`);
    }
  };

  const restoreFeederOnMap = async (feederId: string) => {
    try {
      setFeeders(prev => prev.map(f => f.id === feederId ? { ...f, status: 'active', color: '#10b981', load: Math.floor(Math.random() * 40) + 60 } : f));
      setSelectedFeederId(null);
      setLastUpdate(new Date().toLocaleTimeString());
      showNotification(`${feederId} restored`);
      await updateFeederStatus(feederId, { status: 'ACTIVE' });
      await logSystemEvent(feederId, 'MANUAL_RESTORE', `${feederId} restored from map`, 'INFO', {});
    } catch (error) {
      console.error('Restore failed:', error);
      showNotification(`Error restoring ${feederId}`);
    }
  };

  const updateFaultStatus = (faultId: string, newStatus: FaultLocation['status'], additionalData?: any) => {
    setFaultLocations(prev => prev.map(fault => 
      fault.id === faultId 
        ? { ...fault, status: newStatus, ...additionalData }
        : fault
    ));
    
    // Update feeder status based on fault status
    if (newStatus === 'isolated') {
      setFeeders(prev => prev.map(feeder => {
        const faultOnFeeder = faultLocations.find(f => f.id === faultId && f.feeder === feeder.id);
        if (faultOnFeeder) {
          return { ...feeder, status: 'isolated', color: '#6b7280', load: 0 };
        }
        return feeder;
      }));
    } else if (newStatus === 'resolved') {
      // Restore feeder when fault is resolved
      setFeeders(prev => prev.map(feeder => {
        const faultOnFeeder = faultLocations.find(f => f.id === faultId && f.feeder === feeder.id);
        if (faultOnFeeder) {
          return { ...feeder, status: 'active', color: '#10b981', load: Math.floor(Math.random() * 40) + 60 };
        }
        return feeder;
      }));
    }
    
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const handleAction = async (action: string, fault: FaultLocation) => {
    const currentTime = new Date().toLocaleTimeString();
    
    try {
    switch (action) {
      case 'isolate':
        showNotification(`Initiating SSR auto-isolation for ${fault.feeder}...`);
          
          // Log system event
          await logSystemEvent(fault.feeder, 'FAULT_ISOLATION', `SSR auto-isolation initiated for ${fault.feeder}`, 'CRITICAL', {
            faultId: fault.id,
            action: 'isolate',
            timestamp: currentTime
          });
          
          setTimeout(async () => {
          updateFaultStatus(fault.id, 'isolated', { isolatedAt: currentTime });
            
            // Update feeder status in database
            await updateFeederStatus(fault.feeder, { status: 'ISOLATED' });
            
            // Log successful isolation
            await logSystemEvent(fault.feeder, 'FAULT_ISOLATED', `${fault.feeder} successfully isolated via SSR network`, 'INFO', {
              faultId: fault.id,
              isolatedAt: currentTime
            });
            
          showNotification(`${fault.feeder} successfully isolated via SSR network`);
        }, 2000);
        break;
        
      case 'monitor':
        showNotification(`Enhanced monitoring activated for ${fault.feeder}`);
          
          // Log monitoring activation
          await logSystemEvent(fault.feeder, 'ENHANCED_MONITORING', `Enhanced monitoring activated for ${fault.feeder}`, 'INFO', {
            faultId: fault.id,
            action: 'monitor',
            timestamp: currentTime
          });
          
        updateFaultStatus(fault.id, 'monitoring');
          
          // Update feeder monitoring status
          await updateFeederStatus(fault.feeder, { is_monitoring: true });
          
        setTimeout(() => {
          showNotification(`PQ monitoring active - Real-time data collection started`);
        }, 1000);
        break;
        
      case 'analysis':
        showNotification(`Detailed fault analysis initiated for ${fault.feeder}`);
          
          // Log analysis initiation
          await logSystemEvent(fault.feeder, 'FAULT_ANALYSIS', `Detailed fault analysis initiated for ${fault.feeder}`, 'INFO', {
            faultId: fault.id,
            action: 'analysis',
            timestamp: currentTime
          });
          
          setTimeout(async () => {
            // Log analysis completion
            await logSystemEvent(fault.feeder, 'ANALYSIS_COMPLETE', `Analysis complete - ${fault.description}`, 'INFO', {
              faultId: fault.id,
              analysisResult: fault.description,
              timestamp: currentTime
            });
            
          showNotification(`Analysis complete - ${fault.description}`);
        }, 2000);
        break;
      case 'restore':
        showNotification(`Restoring power to ${fault.feeder}...`);
        updateFaultStatus(fault.id, 'resolved');
        setFeeders(prev => prev.map(f => f.id === fault.feeder ? { ...f, status: 'active', color: '#10b981', load: Math.floor(Math.random() * 40) + 60 } : f));
        await updateFeederStatus(fault.feeder, { status: 'ACTIVE' });
        await logSystemEvent(fault.feeder, 'MANUAL_RESTORE', `${fault.feeder} restored from modal`, 'INFO', {
          faultId: fault.id,
          timestamp: currentTime
        });
        break;
    }
    } catch (error) {
      console.error('Error handling action:', error);
      showNotification(`Error: ${action} action failed`);
    }
    
    setSelectedFault(null);
  };

  const handleControlAction = async (action: string) => {
    const currentTime = new Date().toLocaleTimeString();
    
    try {
    switch (action) {
      case 'emergency':
        showNotification('Emergency isolation protocol activated');
          
          // Log emergency activation
          await logSystemEvent('SYSTEM', 'EMERGENCY_ISOLATION', 'Emergency isolation protocol activated', 'CRITICAL', {
            action: 'emergency',
            timestamp: currentTime
          });
          
        setFeeders(prev => prev.map(f => ({ ...f, status: 'isolated', color: '#6b7280', load: 0 })));
          
          // Update all feeders in database
          for (const feeder of feeders) {
            await updateFeederStatus(feeder.id, { status: 'ISOLATED' });
          }
          
          setTimeout(async () => {
            await logSystemEvent('SYSTEM', 'EMERGENCY_COMPLETE', 'All feeders isolated - System secured', 'INFO', {
              isolatedFeeders: feeders.length,
              timestamp: currentTime
            });
            showNotification('All feeders isolated - System secured');
          }, 2000);
        break;
        
      case 'test_links':
        showNotification('Testing SSR wireless communication links...');
          
          // Log link testing
          await logSystemEvent('SYSTEM', 'LINK_TESTING', 'Testing SSR wireless communication links', 'INFO', {
            action: 'test_links',
            timestamp: currentTime
          });
          
          setTimeout(async () => {
            await logSystemEvent('SYSTEM', 'LINK_TEST_COMPLETE', 'All SSR links operational - 98% signal strength', 'INFO', {
              signalStrength: 98,
              timestamp: currentTime
            });
            showNotification('All SSR links operational - 98% signal strength');
          }, 3000);
        break;
        
      case 'system_check':
        showNotification('Performing system health check...');
          
          // Log system check
          await logSystemEvent('SYSTEM', 'HEALTH_CHECK', 'Performing system health check', 'INFO', {
            action: 'system_check',
            timestamp: currentTime
          });
          
          setTimeout(async () => {
            await logSystemEvent('SYSTEM', 'HEALTH_CHECK_COMPLETE', 'System check complete - All components operational', 'INFO', {
              status: 'operational',
              timestamp: currentTime
            });
            showNotification('System check complete - All components operational');
          }, 2500);
        break;
      case 'restore_all':
        showNotification('Restoring all isolated feeders...');
        // Restore only isolated feeders, keep faults visible unless individually resolved
        setFeeders(prev => prev.map(f => (
          f.status === 'isolated'
            ? { ...f, status: 'active', color: '#10b981', load: Math.floor(Math.random() * 40) + 60 }
            : f
        )));
        // Persist updates for isolated feeders only
        for (const feeder of feeders) {
          if (feeder.status === 'isolated') {
            await updateFeederStatus(feeder.id, { status: 'ACTIVE' });
          }
        }
        await logSystemEvent('SYSTEM', 'RESTORE_ISOLATED_COMPLETE', 'All isolated feeders restored; faults remain for review', 'INFO', {
          timestamp: currentTime
        });
        showNotification('Isolated feeders restored; faults remain visible');
        break;
    }
    } catch (error) {
      console.error('Error handling control action:', error);
      showNotification(`Error: ${action} action failed`);
    }
    
    setLastUpdate(new Date().toLocaleTimeString());
  };

  // Calculate stats
  const totalLines = feeders.length;
  const activeLines = feeders.filter(f => f.status === 'active').length;
  const faultyLines = feeders.filter(f => f.status === 'faulty').length;
  // Stats derived from the actual 30 houses rendered
  const totalHouses = houses.length; // 30
  const offlineHouses = houses.filter(h => h.status === 'offline').length;
  // Note: active faults count currently unused in header; keep computed inline if needed
  // const activeFaults = faultLocations.filter(f => f.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 dark:bg-gray-800 border-b border-gray-700 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white dark:text-white">LT Line Fault Detection - Dashboard</h1>
              <p className="text-sm text-gray-300 dark:text-gray-300">Real-time monitoring & control system</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-300 dark:text-gray-300">
              Last Update: {lastUpdate}
            </div>
            {/* <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 dark:text-red-400 font-medium">{activeFaults} active fault(s) detected</span>
            </div> */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 dark:text-green-400">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Total Lines</p>
                <p className="text-2xl font-bold text-white dark:text-white">{totalLines}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Active Lines</p>
                <p className="text-2xl font-bold text-green-400 dark:text-green-400">{activeLines}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Faulty Lines</p>
                <p className="text-2xl font-bold text-red-400 dark:text-red-400">{faultyLines}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400 dark:text-red-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Total Houses</p>
                <p className="text-2xl font-bold text-purple-400 dark:text-purple-400">{totalHouses}</p>
              </div>
              <Home className="w-8 h-8 text-purple-400 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-3 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Offline Houses</p>
                <p className="text-2xl font-bold text-orange-400 dark:text-orange-400">{offlineHouses}</p>
              </div>
              <Home className="w-8 h-8 text-orange-400 dark:text-orange-400" />
            </div>
          </div>
          
          {/* <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Active Faults</p>
                <p className="text-2xl font-bold text-yellow-400 dark:text-yellow-400">{activeFaults}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400 dark:text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">Critical</p>
                <p className="text-2xl font-bold text-red-400 dark:text-red-400">{criticalFaults}</p>
              </div>
              <Activity className="w-8 h-8 text-red-400 dark:text-red-400" />
            </div>
          </div> */}
        </div>

        {/* Main Content */}
        <div className={`grid ${showDataPanel ? 'grid-cols-6' : 'grid-cols-4'} gap-6`}>
          {/* GIS Map */}
          <div className={`${showDataPanel ? 'col-span-4' : 'col-span-3'} bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700`}>
            <div className="p-4 border-b border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-300 dark:text-gray-300" />
                  <h3 className="font-medium text-white dark:text-white">Electrical Distribution Network</h3>
                </div>
                <div className="flex items-center space-x-4">
                  <button style={{backgroundColor: 'green'}}
                    onClick={() => setShowDataPanel(!showDataPanel)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showDataPanel 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Data Simulation</span>
                    </div>
                  </button>
                  <div className="text-sm text-gray-300 dark:text-gray-300">
                    Interactive network topology with real-time fault monitoring
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Network Diagram */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-2 border-gray-700 dark:border-gray-700" style={{ height: '600px' }}>
                <svg width="100%" height="100%" viewBox="0 0 1100 600" className="overflow-visible">
                  {/* Grid background */}
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Draw feeders with enhanced styling */}
                  {feeders.map((feeder) => (
                    <g key={feeder.id} className="cursor-pointer" onClick={() => {
                      setSelectedFeederId(feeder.id);
                      if (feeder.status === 'faulty') {
                        const f = ensureFaultForFeeder(feeder.id);
                        setSelectedFault(f);
                      }
                    }}>
                      {/* Feeder line with shadow */}
                      <polyline
                        points={feeder.points.map(p => `${p.x},${p.y}`).join(' ')}
                        stroke="#00000020"
                        strokeWidth="6"
                        fill="none"
                        transform="translate(2,2)"
                      />
                      <polyline
                        points={feeder.points.map(p => `${p.x},${p.y}`).join(' ')}
                        stroke={feeder.color}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={feeder.status === 'maintenance' ? '10,5' : feeder.status === 'isolated' ? '6,6' : 'none'}
                      />
                      
                      {/* Power Flow Arrows - show only when active */}
                      {feeder.status === 'active' && feeder.points.map((point, index) => {
                        if (index === feeder.points.length - 1) return null;
                        const nextPoint = feeder.points[index + 1];
                        const midX = (point.x + nextPoint.x) / 2;
                        const midY = (point.y + nextPoint.y) / 2;
                        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
                        
                        return (
                          <g key={`arrow-${feeder.id}-${index}`} transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                            {/* Main flow arrow */}
                            <polygon
                              points="-12,-6 15,0 -12,6"
                              fill={feeder.status === 'active' ? '#10b981' : feeder.status === 'faulty' ? '#ef4444' : '#6b7280'}
                              className="animate-pulse"
                              opacity={feeder.status === 'active' ? '0.9' : '0.6'}
                              stroke={feeder.status === 'active' ? '#059669' : '#dc2626'}
                              strokeWidth="1"
                            />
                            
                            {/* Flow direction indicators */}
                            <circle 
                              cx="-20" 
                              cy="0" 
                              r="3" 
                              fill={feeder.status === 'active' ? '#10b981' : feeder.status === 'faulty' ? '#ef4444' : '#6b7280'}
                              className="animate-ping"
                              opacity="0.8"
                            />
                            <circle 
                              cx="-30" 
                              cy="0" 
                              r="2" 
                              fill={feeder.status === 'active' ? '#10b981' : feeder.status === 'faulty' ? '#ef4444' : '#6b7280'}
                              className="animate-ping"
                              opacity="0.6"
                              style={{ animationDelay: '0.3s' }}
                            />
                            <circle 
                              cx="20" 
                              cy="0" 
                              r="2" 
                              fill={feeder.status === 'active' ? '#10b981' : feeder.status === 'faulty' ? '#ef4444' : '#6b7280'}
                              className="animate-ping"
                              opacity="0.7"
                              style={{ animationDelay: '0.6s' }}
                            />
                            
                            {/* Energy flow lines */}
                            <line
                              x1="-25"
                              y1="0"
                              x2="25"
                              y2="0"
                              stroke={feeder.status === 'active' ? '#10b981' : feeder.status === 'faulty' ? '#ef4444' : '#6b7280'}
                              strokeWidth="2"
                              opacity="0.4"
                              className="animate-pulse"
                            />
                          </g>
                        );
                      })}
                      
                      {/* Line break marker + mini popup when isolated or faulty (always visible) */}
                      {(feeder.status === 'isolated' || feeder.status === 'faulty') && (() => {
                        const midIndex = Math.floor((feeder.points.length - 1) / 2);
                        const a = feeder.points[midIndex];
                        const b = feeder.points[midIndex + 1] || a;
                        const midX = (a.x + b.x) / 2;
                        const midY = (a.y + b.y) / 2;
                        const fault = faultLocations.find(f => f.feeder === feeder.id && f.status !== 'resolved');
                        const isFull = (feeder.load ?? 0) === 0;
                        const label = fault ? getFaultTypeLabel(fault.type) : (isFull ? 'Line Break' : 'Partial Break');
                        const timeStr = fault?.detectedAt ?? new Date().toLocaleTimeString();
                        const sev = fault?.severity?.toUpperCase() ?? (isFull ? 'CRITICAL' : 'MAJOR');
                        const sub = `${sev} • ${displayFeederGroup(feeder.id)} • ${timeStr}`;
                        return (
                          <g transform={`translate(${midX}, ${midY})`} onClick={(e) => { e.stopPropagation(); const f = ensureFaultForFeeder(feeder.id); setSelectedFault(f); }}>
                            {/* small popup above */}
                            <g transform="translate(0, -30)">
                              <rect x="-55" y="-20" width="110" height="16" rx="6" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                              <text x="0" y="-8" fontSize="10" fill="#ef4444" textAnchor="middle" className="font-bold">{label}</text>
                              <rect x="-70" y="0" width="140" height="16" rx="6" fill="#ffffff" stroke="#ef4444" strokeWidth="1" opacity="0.95" />
                              <text x="0" y="12" fontSize="9" fill="#ef4444" textAnchor="middle" className="font-semibold">{sub}</text>
                            </g>
                            {/* circular fault badge */}
                            <circle r={FAULT_MARKER_RADIUS} fill="#dc2626" opacity="0.9" stroke="white" strokeWidth="3" />
                            <circle r={FAULT_MARKER_OUTER} fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.4" />
                            <text x="0" y="4" fontSize="12" fill="white" textAnchor="middle" className="font-bold">⚡</text>
                          </g>
                        );
                      })()}
                      
                      {/* Feeder label with background */}
                      <g transform={`translate(${feeder.points[Math.floor(feeder.points.length / 2)].x}, ${feeder.points[Math.floor(feeder.points.length / 2)].y - 15})`}>
                        <rect x="-25" y="-10" width="50" height="20" fill="white" stroke="#d1d5db" rx="3"/>
                        <text
                          x="0"
                          y="4"
                          fontSize="11"
                          fill="#374151"
                          textAnchor="middle"
                          className="font-semibold"
                        >
                          {feeder.name}
                        </text>
                      </g>

                      {/* Inline isolate control when selected and not already isolated */}
                      {selectedFeederId === feeder.id && feeder.status !== 'isolated' && (
                        <g transform={`translate(${feeder.points[feeder.points.length - 1].x + 60}, ${feeder.points[feeder.points.length - 1].y - 10})`}>
                          <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#dc2626" stroke="white" strokeWidth="1.5" onClick={(e) => { e.stopPropagation(); isolateFeederOnMap(feeder.id); }} />
                          <text x="0" y="4" fontSize="11" fill="white" textAnchor="middle" className="font-semibold" onClick={(e) => { e.stopPropagation(); isolateFeederOnMap(feeder.id); }}>
                            Isolate
                          </text>
                        </g>
                      )}
                      {selectedFeederId === feeder.id && feeder.status === 'isolated' && (
                        <g transform={`translate(${feeder.points[feeder.points.length - 1].x + 60}, ${feeder.points[feeder.points.length - 1].y - 10})`}>
                          <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#10b981" stroke="white" strokeWidth="1.5" onClick={(e) => { e.stopPropagation(); restoreFeederOnMap(feeder.id); }} />
                          <text x="0" y="4" fontSize="11" fill="white" textAnchor="middle" className="font-semibold" onClick={(e) => { e.stopPropagation(); restoreFeederOnMap(feeder.id); }}>
                            Restore
                          </text>
                        </g>
                      )}
                      
                      {/* Load indicator */}
                      <g transform={`translate(${feeder.points[feeder.points.length - 1].x + 10}, ${feeder.points[feeder.points.length - 1].y})`}>
                        <rect x="0" y="-8" width="40" height="16" fill="#f3f4f6" stroke="#d1d5db" rx="2"/>
                        <text x="20" y="2" fontSize="9" fill="#6b7280" textAnchor="middle" className="font-medium">
                          {feeder.load}%
                        </text>
                      </g>
                    </g>
                  ))}
                  
                  {/* Draw substations with enhanced styling */}
                  {substations.map((sub) => (
                    <g key={sub.id}>
                      {/* Substation shadow */}
                      <rect
                        x={sub.x - 28}
                        y={sub.y - 18}
                        width="56"
                        height="36"
                        fill="#00000020"
                        rx="6"
                        transform="translate(3,3)"
                      />
                      {/* Substation body */}
                      <rect
                        x={sub.x - 25}
                        y={sub.y - 15}
                        width="50"
                        height="30"
                        fill={sub.status === 'online' ? '#1f2937' : '#ef4444'}
                        rx="4"
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      {/* Status indicator */}
                      <circle
                        cx={sub.x}
                        cy={sub.y}
                        r="6"
                        fill={sub.status === 'online' ? '#10b981' : '#ef4444'}
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Substation name */}
                      <g transform={`translate(${sub.x}, ${sub.y + 25})`}>
                        <rect x="-40" y="-8" width="80" height="16" fill="white" stroke="#d1d5db" rx="2"/>
                        <text
                          x="0"
                          y="2"
                          fontSize="10"
                          fill="#374151"
                          textAnchor="middle"
                          className="font-semibold"
                        >
                          {sub.name}
                        </text>
                      </g>
                      {/* Voltage label */}
                      <text
                        x={sub.x}
                        y={sub.y + 45}
                        fontSize="9"
                        fill="#6b7280"
                        textAnchor="middle"
                        className="font-medium"
                      >
                        {sub.voltage}
                      </text>
                    </g>
                  ))}
                  
                  {/* Draw houses with connector line to feeder end */}
                  {houses.map((house, index) => (
                    <g key={index}>
                      {/* connector line from nearest feeder end point */}
                      {(() => {
                        const feeder = feeders.find(f => f.id === house.feeder);
                        if (!feeder) return null;
                        const end = feeder.points[feeder.points.length - 1];
                        return (
                          <line x1={end.x} y1={end.y} x2={house.x} y2={house.y}
                            stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                        );
                      })()}
                      {/* House shadow */}
                      <rect
                        x={house.x - 5}
                        y={house.y - 3}
                        width="10"
                        height="8"
                        fill="#00000020"
                        rx="2"
                      />
                      {/* House body */}
                      <rect
                        x={house.x - 5}
                        y={house.y - 5}
                        width="10"
                        height="8"
                        fill={house.status === 'online' ? '#10b981' : '#ef4444'}
                        rx="2"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                      {/* House roof */}
                      <polygon
                        points={`${house.x - 6},${house.y - 5} ${house.x},${house.y - 8} ${house.x + 6},${house.y - 5}`}
                        fill={house.status === 'online' ? '#059669' : '#dc2626'}
                        stroke="white"
                        strokeWidth="1"
                      />
                      {/* Status indicator */}
                      <circle
                        cx={house.x + 3}
                        cy={house.y - 2}
                        r="1.5"
                        fill="white"
                        opacity="0.9"
                      />
                    </g>
                  ))}
                  
                  {/* Draw fault locations with enhanced styling */}
                  {faultLocations.map((fault) => (
                    <g key={fault.id}>
                      {/* Fault indicator with enhanced styling */}
                      <g className="cursor-pointer" onClick={() => handleFaultClick(fault)}>
                        {/* Fault warning circle with pulsing animation */}
                        <circle
                          cx={fault.x}
                          cy={fault.y}
                          r="25"
                          fill={getFaultColor(fault)}
                          className={fault.status === 'active' ? 'animate-pulse' : ''}
                          stroke="white"
                          strokeWidth="3"
                        />
                        
                        {/* Inner fault type indicator */}
                        <circle
                          cx={fault.x}
                          cy={fault.y}
                          r="18"
                          fill="rgba(255,255,255,0.2)"
                          stroke="white"
                          strokeWidth="1"
                        />
                        
                        {/* Fault type icon */}
                        <text
                          x={fault.x}
                          y={fault.y + 6}
                          fontSize="16"
                          fill="white"
                          textAnchor="middle"
                          className="font-bold pointer-events-none"
                        >
                          {getFaultIcon(fault)}
                        </text>
                        
                        {/* Fault severity indicator */}
                        <rect
                          x={fault.x + 15}
                          y={fault.y - 25}
                          width="8"
                          height="8"
                          fill={fault.severity === 'critical' ? '#dc2626' : fault.severity === 'major' ? '#ea580c' : '#f59e0b'}
                          stroke="white"
                          strokeWidth="1"
                          rx="1"
                        />
                      </g>
                      
                      {/* Fault info panel */}
                      <g transform={`translate(${fault.x}, ${fault.y - 45})`}>
                        <rect x="-70" y="-30" width="140" height="25" fill="white" stroke={getFaultColor(fault)} strokeWidth="2" rx="4"/>
                        <text x="0" y="-20" fontSize="11" fill={getFaultColor(fault)} textAnchor="middle" className="font-bold">
                          {getFaultTypeLabel(fault.type)}
                        </text>
                        <text x="0" y="-8" fontSize="9" fill="#6b7280" textAnchor="middle" className="font-medium">
                          {fault.severity.toUpperCase()} • {fault.feeder} • {fault.detectedAt}
                        </text>
                      </g>
                      
                      {/* Click instruction for active faults */}
                      {fault.status === 'active' && (
                        <text
                          x={fault.x}
                          y={fault.y + 50}
                          fontSize="9"
                          fill={getFaultColor(fault)}
                          textAnchor="middle"
                          className="font-bold pointer-events-none animate-pulse"
                        >
                          ⚠️ CLICK FOR FAULT ACTIONS ⚠️
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
              
              {/* Enhanced Network Legend */}
              <div className="mt-6 p-4 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700">
                <h5 className="font-semibold text-white dark:text-white mb-4">Network Legend</h5>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-1 bg-green-500 rounded"></div>
                      <span className="text-gray-300 dark:text-gray-300">Active Feeder (Power Flowing)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-1 bg-red-500 rounded"></div>
                      <span className="text-gray-300 dark:text-gray-300">Faulty Feeder</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-1 bg-gray-500 rounded"></div>
                      <span className="text-gray-300 dark:text-gray-300">Isolated Feeder</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="text-gray-300 dark:text-gray-300">Power Flow Direction</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-3 bg-gray-800 rounded border border-gray-400"></div>
                      <span className="text-gray-300 dark:text-gray-300">Substation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded border border-white"></div>
                      <span className="text-gray-300 dark:text-gray-300">Online House</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded border border-white"></div>
                      <span className="text-gray-300 dark:text-gray-300">Offline House</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">⚡</div>
                      <span className="text-gray-300 dark:text-gray-300">Line Break (Critical)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">🛡️</div>
                      <span className="text-gray-300 dark:text-gray-300">Fault Isolated</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">📊</div>
                      <span className="text-gray-300 dark:text-gray-300">Under Monitoring</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">✅</div>
                      <span className="text-gray-300 dark:text-gray-300">Fault Resolved</span>
                    </div>
                  </div>
                </div>
                {/* Images directly below legend */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 p-3">
                    <h5 className="text-sm font-semibold text-white dark:text-white mb-2" style={{ textAlign: 'center' }}>SIMULATED GIS MAP</h5>
                    <img src="/images/gis-map.jpeg" alt="GIS MAP" className="w-full h-72 object-contain rounded" />
                  </div>
                  <div className="bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 p-3">
                    <h5 className="text-sm font-semibold text-white dark:text-white mb-2"style={{ textAlign: 'center' }}>ORIGINAL MAP</h5>
                    <img src="/images/original-map.jpeg" alt="ORIGINAL MAP" className="w-full h-72 object-contain rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Simulation Panel */}
          {showDataPanel && (
            <div className="col-span-2 space-y-4">
              {/* Real-time System Metrics */}
              <div className="bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700">
                <div className="p-4 border-b border-gray-700 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-blue-400 dark:text-blue-400" />
                    <span className="font-semibold text-white dark:text-white">Data Simulation</span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-xs ${isConnected ? 'text-green-400 dark:text-green-400' : 'text-red-400 dark:text-red-400'}`}>
                      {isConnected ? 'DB Connected' : 'DB Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {realTimeData.system && (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-blue-900/20 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-800/30 dark:border-blue-800/30">
                          <div className="text-blue-300 dark:text-blue-300 font-semibold">Total Load</div>
                          <div className="text-blue-200 dark:text-blue-200 text-lg font-bold">
                            {realTimeData.system.totalLoad?.toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-green-900/20 dark:bg-green-900/20 p-3 rounded-lg border border-green-800/30 dark:border-green-800/30">
                          <div className="text-green-300 dark:text-green-300 font-semibold">Frequency</div>
                          <div className="text-green-200 dark:text-green-200 text-lg font-bold">
                            {realTimeData.system.systemFrequency?.toFixed(2)} Hz
                          </div>
                        </div>
                        <div className="bg-purple-900/20 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-800/30 dark:border-purple-800/30">
                          <div className="text-purple-300 dark:text-purple-300 font-semibold">Generation</div>
                          <div className="text-purple-200 dark:text-purple-200 text-lg font-bold">
                            {realTimeData.system.totalGeneration?.toFixed(0)} MW
                          </div>
                        </div>
                        <div className="bg-orange-900/20 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-800/30 dark:border-orange-800/30">
                          <div className="text-orange-300 dark:text-orange-300 font-semibold">Losses</div>
                          <div className="text-orange-200 dark:text-orange-200 text-lg font-bold">
                            {realTimeData.system.systemLosses?.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-indigo-900/20 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-800/30 dark:border-indigo-800/30">
                          <div className="text-indigo-300 dark:text-indigo-300 font-semibold">Power Factor</div>
                          <div className="text-indigo-200 dark:text-indigo-200 text-lg font-bold">
                            {realTimeData.system.powerFactor?.toFixed(3)}
                          </div>
                        </div>
                        <div className="bg-red-900/20 dark:bg-red-900/20 p-3 rounded-lg border border-red-800/30 dark:border-red-800/30">
                          <div className="text-red-300 dark:text-red-300 font-semibold">Peak Demand</div>
                          <div className="text-red-200 dark:text-red-200 text-lg font-bold">
                            {realTimeData.system.peakDemand?.toFixed(0)} MW
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Feeder Data */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-gray-900">Feeder Analytics</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {feeders.slice(0, 3).map((feeder) => {
                      const data = realTimeData[feeder.id];
                      if (!data) return null;
                      
                      return (
                        <div key={feeder.id} className={`p-3 rounded-lg border-l-4 ${
                          feeder.status === 'active' ? 'border-green-500 bg-green-50' :
                          feeder.status === 'faulty' ? 'border-red-500 bg-red-50' :
                          feeder.status === 'isolated' ? 'border-gray-500 bg-gray-50' :
                          'border-yellow-500 bg-yellow-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{feeder.name}</span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              feeder.status === 'active' ? 'bg-green-100 text-green-800' :
                              feeder.status === 'faulty' ? 'bg-red-100 text-red-800' :
                              feeder.status === 'isolated' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {feeder.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Voltage:</span>
                              <span className={`ml-1 font-semibold ${
                                data.voltage === 0 ? 'text-gray-500' :
                                data.voltage < (feeder.voltage === '33kV' ? 30000 : 10000) ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {data.voltage === 0 ? 'OFF' : `${(data.voltage/1000).toFixed(1)}kV`}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Current:</span>
                              <span className={`ml-1 font-semibold ${
                                data.current === 0 ? 'text-gray-500' :
                                data.current > 200 ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {data.current === 0 ? 'OFF' : `${data.current.toFixed(0)}A`}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Power:</span>
                              <span className={`ml-1 font-semibold ${
                                data.power === 0 ? 'text-gray-500' : 'text-purple-600'
                              }`}>
                                {data.power === 0 ? 'OFF' : `${data.power.toFixed(0)}kW`}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Freq:</span>
                              <span className={`ml-1 font-semibold ${
                                data.frequency === 0 ? 'text-gray-500' :
                                Math.abs(data.frequency - 50) > 0.5 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {data.frequency === 0 ? 'OFF' : `${data.frequency.toFixed(2)}Hz`}
                              </span>
                            </div>
                            {feeder.status === 'faulty' && (
                              <>
                                <div>
                                  <span className="text-gray-600">THD:</span>
                                  <span className="ml-1 font-semibold text-red-600">
                                    {data.thd.toFixed(1)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Fault I:</span>
                                  <span className="ml-1 font-semibold text-red-600">
                                    {data.faultCurrent.toFixed(0)}A
                                  </span>
                                </div>
                              </>
                            )}
                            <div>
                              <span className="text-gray-600">Signal:</span>
                              <span className={`ml-1 font-semibold ${
                                data.signalStrength === 0 ? 'text-gray-500' :
                                data.signalStrength > 90 ? 'text-green-600' :
                                data.signalStrength > 70 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {data.signalStrength === 0 ? 'OFF' : `${data.signalStrength.toFixed(0)}%`}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Temp:</span>
                              <span className={`ml-1 font-semibold ${
                                data.temperature > 60 ? 'text-red-600' :
                                data.temperature > 45 ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {data.temperature.toFixed(0)}°C
                              </span>
                            </div>
                          </div>
                          {feeder.status === 'faulty' && data.lastGasp > 0 && (
                            <div className="mt-2 text-xs">
                              <span className="text-red-600 font-semibold">
                                ⚠️ Last Gasp Signals: {data.lastGasp}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fault Analytics */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Signal className="w-5 h-5 text-red-600" />
                    <h3 className="font-medium text-gray-900">Fault Analytics</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {faultLocations.filter(f => f.status !== 'resolved').map((fault) => {
                    const feederData = realTimeData[fault.feeder];
                    return (
                      <div key={fault.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-red-800">{displayFeederGroup(fault.feeder)}</span>
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                            {fault.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-red-700 mb-2">
                          {getFaultTypeLabel(fault.type)}
                        </div>
                        {feederData && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-red-600">Fault Current:</span>
                              <span className="ml-1 font-semibold text-red-800">
                                {feederData.faultCurrent?.toFixed(0) || 0}A
                              </span>
                            </div>
                            <div>
                              <span className="text-red-600">THD:</span>
                              <span className="ml-1 font-semibold text-red-800">
                                {feederData.thd?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <div>
                              <span className="text-red-600">Last Gasp:</span>
                              <span className="ml-1 font-semibold text-red-800">
                                {feederData.lastGasp || 0} signals
                              </span>
                            </div>
                            <div>
                              <span className="text-red-600">Detection:</span>
                              <span className="ml-1 font-semibold text-red-800">
                                {fault.detectedAt}
                              </span>
                            </div>
                          </div>
                        )}
                        {fault.isolatedAt && (
                          <div className="mt-2 text-xs text-green-600 font-semibold">
                            ✅ Isolated at: {fault.isolatedAt}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {/* Control Panel */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700">
            <div className="p-4 border-b border-gray-700 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-300 dark:text-gray-300" />
                <h3 className="font-medium text-white dark:text-white">Control Panel</h3>
              </div>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h4 className="font-medium text-white dark:text-white mb-3">System Control</h4>
                <div className="space-y-3">
                  <button 
                    onClick={() => handleControlAction('emergency')}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    🚨 Emergency Shutdown
                  </button>
                  <button 
                    onClick={() => handleControlAction('test_links')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    📡 Test SSR Links
                  </button>
                  <button 
                    onClick={() => handleControlAction('system_check')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    🔧 System Health Check
                  </button>
                  <button 
                    onClick={() => handleControlAction('restore_all')}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    🔌 Restore All Feeders
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white dark:text-white mb-3">Feeder Status</h4>
                <div className="space-y-2">
                  {feeders.slice(0, 3).map((feeder) => (
                    <div key={feeder.id} className="flex items-center justify-between p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="text-sm font-semibold text-white dark:text-white">{feeder.name}</span>
                        <div className="text-xs text-gray-300 dark:text-gray-300">{feeder.voltage} • {displayFeederGroup(feeder.id)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {feeder.status === 'active' ? (
                          <Wifi className="w-4 h-4 text-green-600" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          feeder.status === 'active' ? 'bg-green-100 text-green-800' : 
                          feeder.status === 'faulty' ? 'bg-red-100 text-red-800' :
                          feeder.status === 'isolated' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {feeder.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Meters Column */}
              <div className="bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700">
                <div className="p-4 border-b border-gray-700 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-gray-300 dark:text-gray-300" />
                    <h3 className="font-medium text-white dark:text-white">Smart Meters (30)</h3>
                  </div>
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto space-y-2">
                  {smartMeters.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="text-sm font-semibold text-white dark:text-white">{m.id}</span>
                        <div className="text-xs text-gray-300 dark:text-gray-300">Household • {displayFeederGroup(m.feederId)}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className={`${m.online ? 'text-blue-300 dark:text-blue-300' : 'text-gray-400 dark:text-gray-400'} font-semibold`}>{m.voltage === 0 ? 'OFF' : `${m.voltage.toFixed(1)} V`}</div>
                        <div className={`${m.online ? 'text-green-300 dark:text-green-300' : 'text-gray-400 dark:text-gray-400'} font-semibold`}>{m.current === 0 ? 'OFF' : `${m.current.toFixed(1)} A`}</div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${m.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {m.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          <span className="font-medium">{m.online ? 'active' : 'offline'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div>
                <h4 className="font-medium text-white dark:text-white mb-3">Active Faults</h4>
                <div className="space-y-2">
                  {faultLocations.filter(f => f.status !== 'resolved').map((fault) => (
                    <div key={fault.id} className="p-3 bg-red-900/20 dark:bg-red-900/20 rounded-lg border border-red-800/30 dark:border-red-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-red-300 dark:text-red-300">{fault.feeder}</span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          fault.severity === 'critical' ? 'bg-red-900/30 text-red-300' :
                          fault.severity === 'major' ? 'bg-orange-900/30 text-orange-300' :
                          'bg-yellow-900/30 text-yellow-300'
                        }`}>
                          {fault.severity}
                        </span>
                      </div>
                      <div className="text-xs text-red-300 dark:text-red-300">
                        {getFaultTypeLabel(fault.type)}
                      </div>
                      <div className="text-xs text-red-400 dark:text-red-400 mt-1">
                        Detected: {fault.detectedAt}
                      </div>
                      {fault.isolatedAt && (
                        <div className="text-xs text-green-400 dark:text-green-400 mt-1">
                          Isolated: {fault.isolatedAt}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Fault Action Modal */}
      {selectedFault && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white dark:text-white">
                Fault Response Actions - {selectedFault.feeder}
              </h3>
              <button
                onClick={() => setSelectedFault(null)}
                className="text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-red-900/20 dark:bg-red-900/20 rounded-lg border border-red-800/30 dark:border-red-800/30">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-red-300 dark:text-red-300"><strong>Type:</strong> {(() => {
                    const feeder = feeders.find(f => f.id === selectedFault.feeder);
                    const full = (feeder?.load ?? 0) === 0 || feeder?.status === 'faulty';
                    return full ? 'Full Breakage' : 'Partial Breakage';
                  })()}</p>
                  <p className="text-red-300 dark:text-red-300"><strong>Severity:</strong> {selectedFault.severity}</p>
                </div>
                <div>
                  <p className="text-red-300 dark:text-red-300"><strong>Location:</strong> {displayFeederGroup(selectedFault.feeder)}</p>
                  <p className="text-red-300 dark:text-red-300"><strong>Detected:</strong> {selectedFault.detectedAt}</p>
                </div>
              </div>
              <p className="text-red-300 dark:text-red-300 text-sm mt-2 italic">{selectedFault.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {selectedFault.type === 'line_break' || selectedFault.severity === 'critical' ? (
                <>
                  <button
                    onClick={() => handleAction('isolate', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Auto-Isolate</span>
                  </button>
                  <button
                    onClick={() => handleAction('restore', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Restore Power</span>
                  </button>
                  <button
                    onClick={() => handleAction('analysis', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Fault Analysis</span>
                  </button>
                  <button
                    onClick={() => handleAction('monitor', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Monitor</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAction('monitor', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Enhanced Monitor</span>
                  </button>
                  <button
                    onClick={() => handleAction('isolate', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Preventive Isolation</span>
                  </button>
                  <button
                    onClick={() => handleAction('restore', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Restore Power</span>
                  </button>
                  <button
                    onClick={() => handleAction('analysis', selectedFault)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Activity className="w-4 h-4" />
                    <span>PQ Analysis</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;