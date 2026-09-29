import { VehicleTelemetry, CriticalIncident, MaintenanceRecord, DockStatus, HubPerformance } from '../types';

// Zero mock data: Starts empty to allow real operational input
export const INITIAL_VEHICLES: VehicleTelemetry[] = [];

export const INITIAL_INCIDENTS: CriticalIncident[] = [];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [];

// Operational Docks ready for use in CD Cajamar, without fictitious trucks
export const INITIAL_DOCKS: DockStatus[] = [
  { id: 'dock-1', dockNumber: 'D-01', status: 'livre' },
  { id: 'dock-2', dockNumber: 'D-02', status: 'livre' },
  { id: 'dock-3', dockNumber: 'D-03', status: 'livre' },
  { id: 'dock-4', dockNumber: 'D-04', status: 'livre' },
  { id: 'dock-5', dockNumber: 'D-05', status: 'livre' },
  { id: 'dock-6', dockNumber: 'D-06', status: 'livre' },
  { id: 'dock-7', dockNumber: 'D-07', status: 'livre' },
  { id: 'dock-8', dockNumber: 'D-08', status: 'livre' },
];

export const INITIAL_HUBS: HubPerformance[] = [
  { rank: 1, name: 'CD Cajamar (SP)', otif: 100, capacityPercentage: 0, dispatchesToday: 0, status: 'good' },
  { rank: 2, name: 'CD Curitiba (PR)', otif: 100, capacityPercentage: 0, dispatchesToday: 0, status: 'good' },
  { rank: 3, name: 'CD Betim (MG)', otif: 100, capacityPercentage: 0, dispatchesToday: 0, status: 'good' },
];

export const HOURLY_EXPEDITION_DATA: Array<{ hour: string; expedido: number; entregue: number }> = [];
