export type MonitoramentoArea =
  | 'torre-kpis'
  | 'telemetria-frota'
  | 'gestao-entregas'
  | 'suporte-equipes'
  | 'gestao-devolucao'
  | 'gestao-tml'
  | 'soltura'
  | 'gestao-equipes';

export type TabId = 
  | 'monitoramento'
  | MonitoramentoArea
  | 'dashboard-kpis'
  | 'gestao-frota';

export interface DeliveryItem {
  id: string;
  nfeNumber: string;
  cteNumber: string;
  clientName: string;
  clientDocument: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  packagesCount?: number;
  weightKg?: number;
  value?: number;
  deliveryWindow: string;
  status: 'Entregue' | 'Em Rota' | 'Atrasada' | 'Tentativa Frustrada' | 'Aguardando Descarga';
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  deliveryCompletedAt?: string;
  recipientName?: string;
  recipientRg?: string;
  failureReason?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  helperName?: string;
  routeName: string;
  clientName: string;
  nfeNumber: string;
  category: 'Endereço Não Localizado' | 'Cliente Fechado / Ausente' | 'Avaria na Carga' | 'Recusa Comercial' | 'Problema Mecânico' | 'Atraso em Doca Externa' | 'Área de Risco';
  severity: 'alta' | 'media' | 'baixa';
  description: string;
  status: 'Aberto' | 'Em Atendimento' | 'Resolvido' | 'Devolução Autorizada';
  openedAt: string;
  assignedOperator: string;
  slaMinutesRemaining: number;
  lastUpdate: string;
  messages: Array<{
    sender: 'driver' | 'support';
    text: string;
    time: string;
  }>;
}

export interface ReturnItem {
  id: string;
  returnCode: string;
  nfeNumber: string;
  cteNumber: string;
  clientName: string;
  city: string;
  driverName: string;
  vehiclePlate: string;
  itemsDescription: string;
  volumeUnits: number;
  totalValue: number;
  reason: 'Avaria de Transporte' | 'Divergência de Pedido' | 'Recusa Comercial' | 'Cliente Fechado (3 tentativas)' | 'Mercadoria em Desacordo';
  warehouseStatus: 'A Caminho do CD' | 'Em Conferência no Pátio' | 'Laudo Aprovado' | 'Estornado ao Estoque' | 'Destinado a Seguradora';
  registeredAt: string;
  estimatedArrivalAtCD: string;
  checkedBy?: string;
  notes?: string;
}

export interface TmlVehicleRecord {
  id: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
  dockAssigned: string;
  cargoType: string;
  arrivalTime: string;
  currentStage: 'Portaria / Check-in' | 'Fila de Doca' | 'Carregamento / Picking' | 'Conferência Cega & Lacre' | 'Emissão Fiscal (MDF-e)' | 'Liberação / Gate-Out';
  stageIndex: number; // 0 to 5
  totalMinutesInYard: number;
  targetMinutes: number; // SLA standard 135 min (2h 15m)
  stageTimes: {
    checkin: number;
    dockQueue: number;
    loading: number;
    auditSeal: number;
    fiscalBilling: number;
    gateOut: number;
  };
  status: 'no-prazo' | 'atencao' | 'sla-estourado';
  delayReason?: string;
}

export interface SolturaChecklist {
  id: string;
  solturaNumber: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
  helperName: string;
  destinationRoute: string;
  mdfeNumber: string;
  mdfeStatus: 'Autorizado' | 'Em Averbação' | 'Pendente';
  cteCount: number;
  cargoWeightKg: number;
  seals: {
    seal1: string;
    seal2: string;
    isVerified: boolean;
  };
  checklist: {
    tiresPressureChecked: boolean;
    brakesAndLightsChecked: boolean;
    fireExtinguisherValid: boolean;
    trackerSignalActive: boolean;
    doorSensorsActive: boolean;
    teamEpiEquipped: boolean;
  };
  gateStatus: 'Liberado para Saída' | 'Em Validação' | 'Retido por Pendência';
  releaseTimestamp?: string;
  gateOperator: string;
  qrCodePass: string;
}

export interface TeamMemberSchedule {
  id: string;
  name: string;
  role: 'Motorista Titular' | 'Motorista Reserva' | 'Ajudante de Carga' | 'Conferente Externo';
  avatar?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  phone?: string;
  pairedWith?: string; // Driver or Helper paired
  assignedPlate?: string;
  currentRoute?: string;
  shift?: 'Turno A (05h - 14h)' | 'Turno B (14h - 23h)' | 'Turno Noturno (22h - 06h)';
  drivingHoursToday?: string; // ex: 4h 15m
  continuousDrivingHours?: string; // ex: 2h 40m (limit 5h30m)
  dailyOvertimeHours?: string;
  journeyStatus?: 'Em Direção Normal' | 'Pausa Obrigatória' | 'Descanso Interjornada' | 'Folga Semanal' | 'Atenção Limite Legal';
  weeklyScale?: Array<{
    day: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
    status: 'Trabalho' | 'Folga' | 'Plantão' | 'Treinamento';
  }>;
  complianceScore?: number; // 0-100% Lei 13.103 (only when actually measured)
}

export interface VehicleTelemetry {
  id: string;
  model: string;
  plate: string;
  category: string;
  type: 'Carreta 9 Eixos' | 'Bitrem' | 'Cavalo Mecânico' | 'Toco' | 'VUC' | 'Fiorino';
  status: 'Em Rota' | 'Parado (Posto)' | 'Fase Final' | 'Oficina' | 'Pátio';
  statusColor: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  driver: {
    name: string;
    avatar?: string;
    phone?: string;
  };
  location?: string;
  // Registry data (informed at registration)
  odometerKm?: number;
  fuelCapacityL?: number;
  iotDeviceSerial?: string;
  // Telemetry data: only present when a real source (GPS/CAN) provides it
  currentSpeed?: number; // km/h
  engineRpm?: number; // RPM
  fuelLevel?: number; // %
  fuelKmEstimate?: number; // km
  tirePressureStatus?: string;
  tirePressurePsi?: number;
  temperature?: {
    current: number; // °C
    targetMin: number;
    targetMax: number;
    status: 'Estável' | 'Alerta' | 'Crítico';
  };
  idleInfo?: {
    label: string;
    rpm: number;
    duration: string;
  };
  driverHours?: {
    current: string;
    status: string;
  };
  incidentAlert?: {
    title: string;
    timeAgo?: string;
    description?: string;
    severity: 'warning' | 'danger' | 'info' | 'error';
    details?: string;
  };
  routeProgress?: {
    currentKm: number;
    totalKm: number;
    percentage: number;
    origin: string;
    destination: string;
    departureTime: string;
    eta: string;
    delayMinutes?: number;
  };
  gsmLatency?: string;
  satellitesLocked?: number;
  consumption?: string;
  regenerativeScore?: string;
  nfeLiberada?: boolean;
  lastPing?: string;
}

export interface CriticalIncident {
  id: string;
  vehicle: string;
  plate: string;
  driver: string;
  driverPhone: string;
  incidentType: string;
  severity: 'error' | 'warning' | 'info';
  location: string;
  landmark: string;
  slaImpact: string;
  cargoType: string;
  recommendedAction: 'contatar' | 'desvio' | 'suporte';
}

export interface MaintenanceRecord {
  id: string;
  vehicle: string;
  plate: string;
  category: string;
  currentOdometer: string;
  nextRevision: string;
  revisionStatus: string;
  revisionStatusType: 'success' | 'warning' | 'error';
  oilChange: string;
  anttInspection: string;
  insuranceExpiry: string;
  readinessStatus: string;
  readinessType: 'success' | 'warning' | 'error';
}

export interface DockStatus {
  id: string;
  dockNumber: string;
  status: 'descarregando' | 'carregando' | 'livre' | 'manutencao';
  truckPlate?: string;
  truckModel?: string;
  progressPercentage?: number;
  cargoDescription?: string;
  etaCompletion?: string;
}

export interface HubPerformance {
  rank: number;
  name: string;
  otif: number;
  capacityPercentage: number;
  dispatchesToday: number;
  status: 'good' | 'warning' | 'critical';
}

// ── TOUR (MAPA) ──────────────────────────────────────────────

export interface Tour {
  id: string;
  external_tour_id: number;           // tour_display_id do BEES
  tour_date: string;                  // 'YYYY-MM-DD'
  distribution_center_id: string | null;
  driver_name: string;
  vehicle_plate: string | null;
  trip_start: string | null;          // saída do CDD
  trip_end: string | null;
  status: string | null;
  is_overnight: boolean;
  comments: string | null;

  // TML
  arrived_at_cdd: string | null;      // entrada manual pelo analista
  tml_exceeded_reason: string | null;

  created_at: string;
  updated_at: string;
}

// Vem da view tours_with_tml
export interface TourWithTML extends Tour {
  tml_minutes: number | null;
  tml_exceeded: boolean;
  deliveries?: Delivery[];
}

export type TourInsert = Omit<Tour, 'id' | 'created_at' | 'updated_at'>;

export interface TourTMLUpdate {
  arrived_at_cdd: string;
  tml_exceeded_reason?: string;
}

// ── DELIVERY (PARADA / POC) ──────────────────────────────────

export type DeliveryStatus = string;

export interface Delivery {
  id: string;
  tour_id: string;
  poc_external_id: string | null;
  poc_name: string;
  critical_poc: boolean;
  visit_order: number | null;
  status: DeliveryStatus;
  delivery_window: string | null;

  arrived_at: string | null;
  finished_at: string | null;
  actual_delivery_time_seconds: number | null;

  within_radius: boolean | null;
  out_of_radius_reason: string | null;

  skipped: boolean;
  reschedule_reason: string | null;

  total_delivered_vol_hl: number | null;
  total_refused_vol_hl: number | null;
  total_delivered_weight_kg: number | null;
  total_refused_weight_kg: number | null;

  created_at: string;
  updated_at: string;
}

export type DeliveryInsert = Omit<Delivery, 'id' | 'created_at' | 'updated_at'>;

// ── DEVOLUTION (DEVOLUÇÃO) ───────────────────────────────────

export type DevolutionStatus = string;

export interface Devolution {
  id: string;
  delivery_id: string;
  tour_id: string;
  poc_external_id: string | null;
  poc_name: string | null;
  reason: string;
  reason_description: string | null;
  status: DevolutionStatus;
  supervisor_id: string | null;
  approved_at: string | null;
  supervisor_comments: string | null;
  created_at: string;
  updated_at: string;
}

export type DevolutionInsert = Omit<
  Devolution,
  'id' | 'created_at' | 'updated_at' | 'supervisor_id' | 'approved_at' | 'supervisor_comments'
>;

export interface DevolutionApproval {
  status: 'APPROVED' | 'REJECTED';
  supervisor_comments?: string;
}

// ── KPIs ─────────────────────────────────────────────────────

export interface TourKPIs {
  total_tours: number;
  tours_in_route: number;
  tours_concluded: number;
  tours_overnight: number;
  total_pocs: number;
  pocs_concluded: number;
  pocs_rescheduled: number;
  avg_tml_minutes: number | null;
  tml_exceeded_count: number;
  total_delivered_vol_hl: number;
  total_refused_vol_hl: number;
  adherence_rate: number;
}
