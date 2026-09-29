import {
  VehicleTelemetry,
  CriticalIncident,
  MaintenanceRecord,
  DockStatus,
  DeliveryItem,
  SupportTicket,
  ReturnItem,
  TmlVehicleRecord,
  SolturaChecklist,
  TeamMemberSchedule,
} from '../types';
import { INITIAL_DOCKS } from '../data/erpData';

export interface ShipmentRecord {
  id: string;
  nfe: string;
  client: string;
  origin: string;
  dest: string;
  weight: string;
  sla: string;
  status: 'Em Trânsito' | 'Atrasado' | 'Em Rota' | 'Entregue' | 'Pendente';
  badge: 'info' | 'danger' | 'success' | 'warning';
}

export interface InvoiceRecord {
  cte: string;
  client: string;
  val: string;
  date: string;
  status: 'Autorizado SEFAZ' | 'Em Processamento' | 'Liquidado' | 'Cancelado';
  badge: 'success' | 'warning' | 'info' | 'danger';
}

const KEYS = {
  VEHICLES: 'hl_op_vehicles',
  INCIDENTS: 'hl_op_incidents',
  MAINTENANCE: 'hl_op_maintenance',
  DOCKS: 'hl_op_docks',
  DELIVERIES: 'hl_op_deliveries',
  TICKETS: 'hl_op_tickets',
  RETURNS: 'hl_op_returns',
  TML: 'hl_op_tml',
  SOLTURAS: 'hl_op_solturas',
  TEAM: 'hl_op_team',
  SHIPMENTS: 'hl_op_shipments',
  INVOICES: 'hl_op_invoices',
};

// --- change notification (lets badges/screens react to writes without prop drilling) ---
const listeners = new Set<() => void>();
let storageVersion = 0;

function notify() {
  storageVersion++;
  listeners.forEach((l) => l());
}

export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  const onExternal = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('hl_op_')) notify(); // another tab wrote
  };
  window.addEventListener('storage', onExternal);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onExternal);
  };
}

export function getStorageVersion(): number {
  return storageVersion;
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Every collection is an array: reject corrupted/foreign payloads instead of crashing screens
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notify();
  } catch (err) {
    console.error(`Failed to persist key ${key}:`, err);
  }
}

export const OperationalStorage = {
  // Vehicles
  getVehicles: (): VehicleTelemetry[] => getItem<VehicleTelemetry[]>(KEYS.VEHICLES, []),
  setVehicles: (data: VehicleTelemetry[]) => setItem(KEYS.VEHICLES, data),
  addVehicle: (v: VehicleTelemetry) => {
    const list = OperationalStorage.getVehicles();
    const updated = [v, ...list];
    OperationalStorage.setVehicles(updated);
    return updated;
  },
  deleteVehicle: (id: string) => {
    const list = OperationalStorage.getVehicles().filter((v) => v.id !== id);
    OperationalStorage.setVehicles(list);
    return list;
  },

  // Deliveries
  getDeliveries: (): DeliveryItem[] => getItem<DeliveryItem[]>(KEYS.DELIVERIES, []),
  setDeliveries: (data: DeliveryItem[]) => setItem(KEYS.DELIVERIES, data),
  addDelivery: (d: DeliveryItem) => {
    const list = OperationalStorage.getDeliveries();
    const updated = [d, ...list];
    OperationalStorage.setDeliveries(updated);
    return updated;
  },
  deleteDelivery: (id: string) => {
    const list = OperationalStorage.getDeliveries().filter((d) => d.id !== id);
    OperationalStorage.setDeliveries(list);
    return list;
  },

  // Incidents
  getIncidents: (): CriticalIncident[] => getItem<CriticalIncident[]>(KEYS.INCIDENTS, []),
  setIncidents: (data: CriticalIncident[]) => setItem(KEYS.INCIDENTS, data),
  addIncident: (inc: CriticalIncident) => {
    const list = OperationalStorage.getIncidents();
    const updated = [inc, ...list];
    OperationalStorage.setIncidents(updated);
    return updated;
  },
  deleteIncident: (id: string) => {
    const list = OperationalStorage.getIncidents().filter((i) => i.id !== id);
    OperationalStorage.setIncidents(list);
    return list;
  },

  // Maintenance
  getMaintenance: (): MaintenanceRecord[] => getItem<MaintenanceRecord[]>(KEYS.MAINTENANCE, []),
  setMaintenance: (data: MaintenanceRecord[]) => setItem(KEYS.MAINTENANCE, data),
  addMaintenance: (m: MaintenanceRecord) => {
    const list = OperationalStorage.getMaintenance();
    const updated = [m, ...list];
    OperationalStorage.setMaintenance(updated);
    return updated;
  },

  // Docks
  getDocks: (): DockStatus[] => getItem<DockStatus[]>(KEYS.DOCKS, INITIAL_DOCKS),
  setDocks: (data: DockStatus[]) => setItem(KEYS.DOCKS, data),

  // Returns
  getReturns: (): ReturnItem[] => getItem<ReturnItem[]>(KEYS.RETURNS, []),
  setReturns: (data: ReturnItem[]) => setItem(KEYS.RETURNS, data),
  addReturn: (r: ReturnItem) => {
    const list = OperationalStorage.getReturns();
    const updated = [r, ...list];
    OperationalStorage.setReturns(updated);
    return updated;
  },

  // Tickets
  getTickets: (): SupportTicket[] => getItem<SupportTicket[]>(KEYS.TICKETS, []),
  setTickets: (data: SupportTicket[]) => setItem(KEYS.TICKETS, data),
  addTicket: (t: SupportTicket) => {
    const list = OperationalStorage.getTickets();
    const updated = [t, ...list];
    OperationalStorage.setTickets(updated);
    return updated;
  },

  // TML
  getTmlVehicles: (): TmlVehicleRecord[] => getItem<TmlVehicleRecord[]>(KEYS.TML, []),
  setTmlVehicles: (data: TmlVehicleRecord[]) => setItem(KEYS.TML, data),
  addTmlVehicle: (t: TmlVehicleRecord) => {
    const list = OperationalStorage.getTmlVehicles();
    const updated = [t, ...list];
    OperationalStorage.setTmlVehicles(updated);
    return updated;
  },

  // Solturas
  getSolturas: (): SolturaChecklist[] => getItem<SolturaChecklist[]>(KEYS.SOLTURAS, []),
  setSolturas: (data: SolturaChecklist[]) => setItem(KEYS.SOLTURAS, data),
  addSoltura: (s: SolturaChecklist) => {
    const list = OperationalStorage.getSolturas();
    const updated = [s, ...list];
    OperationalStorage.setSolturas(updated);
    return updated;
  },

  // Team Members
  getTeamMembers: (): TeamMemberSchedule[] => getItem<TeamMemberSchedule[]>(KEYS.TEAM, []),
  setTeamMembers: (data: TeamMemberSchedule[]) => setItem(KEYS.TEAM, data),
  addTeamMember: (tm: TeamMemberSchedule) => {
    const list = OperationalStorage.getTeamMembers();
    const updated = [tm, ...list];
    OperationalStorage.setTeamMembers(updated);
    return updated;
  },

  // Shipments
  getShipments: (): ShipmentRecord[] => getItem<ShipmentRecord[]>(KEYS.SHIPMENTS, []),
  setShipments: (data: ShipmentRecord[]) => setItem(KEYS.SHIPMENTS, data),
  addShipment: (s: ShipmentRecord) => {
    const list = OperationalStorage.getShipments();
    const updated = [s, ...list];
    OperationalStorage.setShipments(updated);
    return updated;
  },

  // Invoices
  getInvoices: (): InvoiceRecord[] => getItem<InvoiceRecord[]>(KEYS.INVOICES, []),
  setInvoices: (data: InvoiceRecord[]) => setItem(KEYS.INVOICES, data),
  addInvoice: (inv: InvoiceRecord) => {
    const list = OperationalStorage.getInvoices();
    const updated = [inv, ...list];
    OperationalStorage.setInvoices(updated);
    return updated;
  },

  // Bulk Export / Import
  exportAll: () => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '1.1',
        vehicles: OperationalStorage.getVehicles(),
        deliveries: OperationalStorage.getDeliveries(),
        incidents: OperationalStorage.getIncidents(),
        maintenance: OperationalStorage.getMaintenance(),
        docks: OperationalStorage.getDocks(),
        returns: OperationalStorage.getReturns(),
        tickets: OperationalStorage.getTickets(),
        tml: OperationalStorage.getTmlVehicles(),
        solturas: OperationalStorage.getSolturas(),
        team: OperationalStorage.getTeamMembers(),
        shipments: OperationalStorage.getShipments(),
        invoices: OperationalStorage.getInvoices(),
      },
      null,
      2
    );
  },

  importAll: (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
      if (Array.isArray(data.vehicles)) OperationalStorage.setVehicles(data.vehicles);
      if (Array.isArray(data.deliveries)) OperationalStorage.setDeliveries(data.deliveries);
      if (Array.isArray(data.incidents)) OperationalStorage.setIncidents(data.incidents);
      if (Array.isArray(data.maintenance)) OperationalStorage.setMaintenance(data.maintenance);
      if (Array.isArray(data.docks)) OperationalStorage.setDocks(data.docks);
      if (Array.isArray(data.returns)) OperationalStorage.setReturns(data.returns);
      if (Array.isArray(data.tickets)) OperationalStorage.setTickets(data.tickets);
      if (Array.isArray(data.tml)) OperationalStorage.setTmlVehicles(data.tml);
      if (Array.isArray(data.solturas)) OperationalStorage.setSolturas(data.solturas);
      if (Array.isArray(data.team)) OperationalStorage.setTeamMembers(data.team);
      if (Array.isArray(data.shipments)) OperationalStorage.setShipments(data.shipments);
      if (Array.isArray(data.invoices)) OperationalStorage.setInvoices(data.invoices);
      return true;
    } catch {
      return false;
    }
  },

  clearAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    notify();
  },
};
