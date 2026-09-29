// src/hooks/useTours.ts
import { useState, useEffect, useCallback } from 'react';
import {
  fetchTours,
  fetchDevolutions,
  fetchPendingDevolutions,
  updateTourTML,
  closeTour,
  setTourOvernight,
  approveDevolution,
  insertDevolution,
  upsertToursBatch,
  upsertDeliveriesBatch,
  subscribeToTours,
  subscribeToDevolutions,
} from '../services/api/tours';
import type {
  TourWithTML,
  TourTMLUpdate,
  DevolutionInsert,
  DevolutionApproval,
  TourKPIs,
  TourInsert,
  DeliveryInsert,
  Devolution,
} from '../types';

// ── useTours ──────────────────────────────────────────────────

export function useTours(date?: string) {
  const [tours, setTours] = useState<TourWithTML[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTours(targetDate);
      setTours(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar rotas');
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToTours(targetDate, load);
    return () => {
      if (typeof unsubscribe === 'function') {
        void unsubscribe();
      }
    };
  }, [targetDate, load]);

  const registerTML = useCallback(
    async (tourId: string, tml: TourTMLUpdate) => {
      try {
        await updateTourTML(tourId, tml);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao registrar TML');
        throw e;
      }
    },
    []
  );

  const closeMap = useCallback(
    async (tourId: string, comments?: string) => {
      try {
        await closeTour(tourId, comments);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao fechar mapa');
        throw e;
      }
    },
    []
  );

  const setOvernight = useCallback(async (tourId: string) => {
    try {
      await setTourOvernight(tourId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar pernoite');
      throw e;
    }
  }, []);

  const importFromCSV = useCallback(
    async (toursData: TourInsert[], deliveriesData: DeliveryInsert[]) => {
      try {
        setLoading(true);
        const tourCount = await upsertToursBatch(toursData);
        const deliveryCount = await upsertDeliveriesBatch(deliveriesData);
        await load();
        return { tourCount, deliveryCount };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro na importação');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [load]
  );

  const kpis: TourKPIs = {
    total_tours: tours.length,
    tours_in_route: tours.filter((t) => t.status === 'IN_ROUTE').length,
    tours_concluded: tours.filter((t) => t.status === 'CONCLUDED').length,
    tours_overnight: tours.filter((t) => t.is_overnight).length,
    total_pocs: tours.reduce((acc, t) => acc + (t.deliveries?.length ?? 0), 0),
    pocs_concluded: tours.reduce(
      (acc, t) =>
        acc + (t.deliveries?.filter((d) => d.status === 'CONCLUDED').length ?? 0),
      0
    ),
    pocs_rescheduled: tours.reduce(
      (acc, t) =>
        acc + (t.deliveries?.filter((d) => d.status === 'RESCHEDULED').length ?? 0),
      0
    ),
    avg_tml_minutes: (() => {
      const withTML = tours.filter((t) => t.tml_minutes !== null);
      if (!withTML.length) return null;
      return Math.round(
        withTML.reduce((acc, t) => acc + (t.tml_minutes ?? 0), 0) / withTML.length
      );
    })(),
    tml_exceeded_count: tours.filter((t) => t.tml_exceeded).length,
    total_delivered_vol_hl: tours.reduce(
      (acc, t) =>
        acc +
        (t.deliveries?.reduce(
          (a, d) => a + (d.total_delivered_vol_hl ?? 0),
          0
        ) ?? 0),
      0
    ),
    total_refused_vol_hl: tours.reduce(
      (acc, t) =>
        acc +
        (t.deliveries?.reduce(
          (a, d) => a + (d.total_refused_vol_hl ?? 0),
          0
        ) ?? 0),
      0
    ),
    adherence_rate: (() => {
      const all = tours.flatMap((t) => t.deliveries ?? []);
      if (!all.length) return 0;
      const inRadius = all.filter((d) => d.within_radius === true).length;
      return Math.round((inRadius / all.length) * 100);
    })(),
  };

  return {
    tours,
    kpis,
    loading,
    error,
    registerTML,
    closeMap,
    setOvernight,
    importFromCSV,
    reload: load,
  };
}

// ── useDevolutions ────────────────────────────────────────────

export function useDevolutions(tourId?: string) {
  const [devolutions, setDevolutions] = useState<Devolution[]>([]);
  const [pending, setPending] = useState<
    Awaited<ReturnType<typeof fetchPendingDevolutions>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [devs, pend] = await Promise.all([
        fetchDevolutions(tourId),
        fetchPendingDevolutions(),
      ]);
      setDevolutions(devs);
      setPending(pend);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToDevolutions(load);
    return () => {
      if (typeof unsubscribe === 'function') {
        void unsubscribe();
      }
    };
  }, [load]);

  const createDevolution = useCallback(
    async (devolution: DevolutionInsert) => {
      try {
        await insertDevolution(devolution);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao registrar devolução');
        throw e;
      }
    },
    []
  );

  const approve = useCallback(
    async (
      devolutionId: string,
      approval: DevolutionApproval,
      supervisorId: string
    ) => {
      try {
        await approveDevolution(devolutionId, approval, supervisorId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao processar devolução');
        throw e;
      }
    },
    []
  );

  return {
    devolutions,
    pending,
    loading,
    error,
    createDevolution,
    approve,
    reload: load,
  };
}