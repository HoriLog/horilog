import { DeliveryItem, TeamMemberSchedule, VehicleTelemetry } from '../types';
import { ShipmentRecord } from './storageService';
import { parseCsv, pick } from '../utils/csv';
import { normalizePlate, parseNumberBR } from '../utils/format';

export type ImportCategory = 'vehicles' | 'deliveries' | 'team' | 'shipments';

export interface ImportResult<T> {
  items: T[];
  rejected: Array<{ line: number; reason: string }>;
}

const VEHICLE_TYPES: VehicleTelemetry['type'][] = ['Carreta 9 Eixos', 'Bitrem', 'Cavalo Mecânico', 'Toco', 'VUC', 'Fiorino'];
const ROLES: TeamMemberSchedule['role'][] = ['Motorista Titular', 'Motorista Reserva', 'Ajudante de Carga', 'Conferente Externo'];
const SHIFTS = ['Turno A (05h - 14h)', 'Turno B (14h - 23h)', 'Turno Noturno (22h - 06h)'] as const;

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function matchOne<T extends string>(raw: string | undefined, options: readonly T[]): T | undefined {
  if (!raw) return undefined;
  const f = fold(raw);
  return options.find((o) => fold(o) === f) ?? options.find((o) => fold(o).startsWith(f) || f.startsWith(fold(o).split(' ')[0]));
}

const stamp = () => Date.now().toString(36);

export function importVehicles(text: string, existingPlates: Set<string>): ImportResult<VehicleTelemetry> {
  const { records } = parseCsv(text);
  const items: VehicleTelemetry[] = [];
  const rejected: ImportResult<VehicleTelemetry>['rejected'] = [];
  const seen = new Set(existingPlates);
  records.forEach((r, idx) => {
    const line = idx + 2;
    const plate = normalizePlate(pick(r, 'Placa') ?? '');
    if (!plate) return rejected.push({ line, reason: 'placa ausente ou inválida' });
    if (seen.has(plate)) return rejected.push({ line, reason: `placa ${plate} duplicada` });
    seen.add(plate);
    const type = matchOne(pick(r, 'Tipo', 'Categoria'), VEHICLE_TYPES) ?? 'Toco';
    items.push({
      id: `veh-${stamp()}-${idx}`,
      plate,
      model: pick(r, 'Modelo') ?? '',
      type,
      category: pick(r, 'Tipo', 'Categoria') ?? type,
      status: 'Pátio', // registered, but nothing says it is on the road
      statusColor: 'neutral',
      driver: { name: pick(r, 'Motorista') ?? '', phone: pick(r, 'Telefone') },
      location: pick(r, 'Localizacao', 'Local'),
    });
  });
  return { items, rejected };
}

export function importDeliveries(text: string, existingNfe: Set<string>): ImportResult<DeliveryItem> {
  const { records } = parseCsv(text);
  const items: DeliveryItem[] = [];
  const rejected: ImportResult<DeliveryItem>['rejected'] = [];
  const seen = new Set(existingNfe);
  records.forEach((r, idx) => {
    const line = idx + 2;
    const nfe = pick(r, 'NFe', 'Nota', 'NotaFiscal');
    const client = pick(r, 'Cliente');
    if (!nfe) return rejected.push({ line, reason: 'NFe ausente' });
    if (!client) return rejected.push({ line, reason: 'cliente ausente' });
    if (seen.has(nfe)) return rejected.push({ line, reason: `NFe ${nfe} duplicada` });
    seen.add(nfe);
    const plateRaw = pick(r, 'Placa');
    items.push({
      id: `del-${stamp()}-${idx}`,
      nfeNumber: nfe,
      cteNumber: pick(r, 'CTe') ?? '',
      clientName: client,
      clientDocument: pick(r, 'CNPJ', 'Documento') ?? '',
      address: pick(r, 'Endereco') ?? '',
      neighborhood: pick(r, 'Bairro') ?? '',
      city: pick(r, 'Cidade') ?? '',
      state: pick(r, 'UF') ?? '',
      packagesCount: parseNumberBR(pick(r, 'Volumes')),
      weightKg: parseNumberBR(pick(r, 'PesoKg', 'Peso')),
      value: parseNumberBR(pick(r, 'Valor')),
      deliveryWindow: pick(r, 'Janela') ?? '',
      status: 'Em Rota',
      vehiclePlate: plateRaw ? normalizePlate(plateRaw) ?? plateRaw : '',
      driverName: pick(r, 'Motorista') ?? '',
      driverPhone: pick(r, 'TelefoneMotorista', 'Telefone') ?? '',
    });
  });
  return { items, rejected };
}

export function importTeam(text: string, existingKeys: Set<string>): ImportResult<TeamMemberSchedule> {
  const { records } = parseCsv(text);
  const items: TeamMemberSchedule[] = [];
  const rejected: ImportResult<TeamMemberSchedule>['rejected'] = [];
  const seen = new Set(existingKeys);
  records.forEach((r, idx) => {
    const line = idx + 2;
    const name = pick(r, 'Nome');
    if (!name) return rejected.push({ line, reason: 'nome ausente' });
    const roleRaw = pick(r, 'Cargo', 'Funcao');
    const role = matchOne(roleRaw, ROLES) ?? (roleRaw && /ajud/i.test(roleRaw) ? 'Ajudante de Carga' : undefined);
    if (!role) return rejected.push({ line, reason: `cargo não reconhecido (${roleRaw ?? 'vazio'})` });
    const plateRaw = pick(r, 'PlacaVeiculo', 'Placa');
    const key = fold(name) + '|' + role;
    if (seen.has(key)) return rejected.push({ line, reason: `${name} duplicado` });
    seen.add(key);
    items.push({
      id: `team-${stamp()}-${idx}`,
      name,
      role,
      phone: pick(r, 'Telefone'),
      assignedPlate: plateRaw ? normalizePlate(plateRaw) ?? plateRaw : undefined,
      shift: matchOne(pick(r, 'Turno'), SHIFTS),
      cnhCategory: pick(r, 'CNH', 'CategoriaCNH'),
      currentRoute: pick(r, 'Rota'),
    });
  });
  return { items, rejected };
}

export function importShipments(text: string, existingIds: Set<string>): ImportResult<ShipmentRecord> {
  const { records } = parseCsv(text);
  const items: ShipmentRecord[] = [];
  const rejected: ImportResult<ShipmentRecord>['rejected'] = [];
  const seen = new Set(existingIds);
  records.forEach((r, idx) => {
    const line = idx + 2;
    const id = pick(r, 'Codigo', 'Remessa');
    if (!id) return rejected.push({ line, reason: 'código ausente' });
    if (seen.has(id)) return rejected.push({ line, reason: `código ${id} duplicado` });
    seen.add(id);
    items.push({
      id,
      nfe: pick(r, 'NFe') ?? '',
      client: pick(r, 'Cliente') ?? '',
      origin: pick(r, 'Origem') ?? '',
      dest: pick(r, 'Destino') ?? '',
      weight: pick(r, 'Peso') ?? '',
      sla: pick(r, 'SLA') ?? '',
      status: 'Pendente',
      badge: 'warning',
    });
  });
  return { items, rejected };
}
