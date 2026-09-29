import { supabase } from '../supabaseClient';
import { VehicleTelemetry } from '../../types';

interface VehicleRow {
  id: string;
  plate: string;
  model: string;
  category: string | null;
  type: string;
  status: string;
  status_color: string;
  driver_name: string | null;
  driver_phone: string | null;
  location: string | null;
  odometer_km: number | null;
  fuel_capacity_l: number | null;
  iot_device_serial: string | null;
  current_speed: number | null;
  engine_rpm: number | null;
  fuel_level: number | null;
  fuel_km_estimate: number | null;
  tire_pressure_status: string | null;
  tire_pressure_psi: number | null;
  gsm_latency: string | null;
}

function rowToVehicle(row: VehicleRow): VehicleTelemetry {
  return {
    id: row.id,
    plate: row.plate,
    model: row.model,
    category: row.category ?? row.type,
    type: row.type as VehicleTelemetry['type'],
    status: row.status as VehicleTelemetry['status'],
    statusColor: row.status_color as VehicleTelemetry['statusColor'],
    driver: { name: row.driver_name ?? '', phone: row.driver_phone ?? undefined },
    location: row.location ?? undefined,
    odometerKm: row.odometer_km ?? undefined,
    fuelCapacityL: row.fuel_capacity_l ?? undefined,
    iotDeviceSerial: row.iot_device_serial ?? undefined,
    currentSpeed: row.current_speed ?? undefined,
    engineRpm: row.engine_rpm ?? undefined,
    fuelLevel: row.fuel_level ?? undefined,
    fuelKmEstimate: row.fuel_km_estimate ?? undefined,
    tirePressureStatus: row.tire_pressure_status ?? undefined,
    tirePressurePsi: row.tire_pressure_psi ?? undefined,
    gsmLatency: row.gsm_latency ?? undefined,
  };
}

export async function listVehicles(): Promise<VehicleTelemetry[]> {
  const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as VehicleRow[]).map(rowToVehicle);
}

export interface NewVehicleInput {
  plate: string;
  model: string;
  category: string;
  driverName?: string;
  odometerKm?: number;
  fuelCapacityL?: number;
  iotDeviceSerial?: string;
}

export async function createVehicle(input: NewVehicleInput): Promise<VehicleTelemetry> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      plate: input.plate,
      model: input.model,
      category: input.category,
      type: input.category,
      driver_name: input.driverName || null,
      odometer_km: input.odometerKm ?? null,
      fuel_capacity_l: input.fuelCapacityL ?? null,
      iot_device_serial: input.iotDeviceSerial || null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToVehicle(data as VehicleRow);
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

/** Chama `onChange` sempre que qualquer linha da tabela mudar (em qualquer navegador/usuário). */
export function subscribeToVehicles(onChange: () => void): () => void {
  const channelName = `vehicles-changes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}