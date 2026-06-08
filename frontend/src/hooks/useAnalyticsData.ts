'use client';

import { useState, useEffect, useCallback } from 'react';

export type Period    = 'week' | 'month' | 'quarter';
export type FinPeriod = 'monthly' | 'quarterly' | 'yearly';
export type SalePeriod = 'monthly' | 'quarterly' | 'yearly';

export interface OpsData {
  trend:       number[];
  kpis:        { label:string; value:string; delta:number; unit:string; goodUp:boolean; spark:number[] }[];
  totals:      { trips:number; dist:string; util:number };
  alerts:      { label:string; count:number; color:string }[];
  fleetStatus: { label:string; count:number; color:string }[];
  totalFleet:  number;
  xLabels:     string[];
}

export interface FinRow  { label:string; revenue:number; cellular:number; opsCost:number; vehicles:number }
export interface FinSummary {
  totalRevenue:number; totalCellular:number; totalCost:number;
  netIncome:number; netMarginPct:number; revenuePerVehicle:number;
  revDelta:number; cellDelta:number;
}
export interface FinData { rows:FinRow[]; summary:FinSummary }

export interface SaleRow  { label:string; newContracts:number; renewals:number; churned:number; pipeline:number; revenue:number }
export interface SaleSummary {
  totalNewContracts:number; totalRenewals:number; totalChurned:number;
  netContracts:number; avgDealSize:number; churnRate:number;
  revDelta:number; latestPipeline:number; latestRevenue:number;
}
export interface SaleData { rows:SaleRow[]; summary:SaleSummary }

export interface ConfigData {
  speeds:           { range:string; pct:number; safe:boolean }[];
  salesReps:        { name:string; deals:number; revenue:number; quota:number; conv:number }[];
  saleChannels:     { label:string; pct:number; color:string }[];
  cellularCarriers: { name:string; pct:number; color:string }[];
  revStreams:       { label:string; pct:number; color:string }[];
  planMix:          { label:string; arr:number; vehicles:number; color:string }[];
  funnelStages:     { label:string; value:number; color:string }[];
  vehicles:         { id:string; km:number; fuel:number }[];
  drivers:          { name:string; score:number; trips:number; dist:string }[];
  insights:         { icon:string; title:string; body:string; bg:string; bd:string }[];
}

interface AnalyticsState {
  ops:     OpsData    | null;
  fin:     FinData    | null;
  sale:    SaleData   | null;
  config:  ConfigData | null;
  loading: boolean;
  error:   string | null;
}

export function useAnalyticsData(
  tenantId: string,
  period: Period,
  finPeriod: FinPeriod,
  salePeriod: SalePeriod,
) {
  const [state, setState] = useState<AnalyticsState>({
    ops: null, fin: null, sale: null, config: null, loading: true, error: null,
  });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const base = '/api/v1/analytics';
      const tid  = `tenantId=${tenantId}`;

      const cfgPeriod = period !== 'week' && period !== 'month' && period !== 'quarter'
        ? period : period;

      const [opsRes, finRes, saleRes, cfgRes] = await Promise.all([
        fetch(`${base}/operations?${tid}&period=${period}`),
        fetch(`${base}/financial?${tid}&period=${finPeriod}`),
        fetch(`${base}/sales?${tid}&period=${salePeriod}`),
        fetch(`${base}/config?${tid}&view=operations&period=${cfgPeriod}`),
      ]);

      const [opsJson, finJson, saleJson, cfgJson] = await Promise.all([
        opsRes.ok  ? opsRes.json()  : null,
        finRes.ok  ? finRes.json()  : null,
        saleRes.ok ? saleRes.json() : null,
        cfgRes.ok  ? cfgRes.json()  : null,
      ]);

      setState({
        ops:    opsJson?.empty  || opsJson?.error  ? null : opsJson  as OpsData,
        fin:    finJson?.empty  || finJson?.error  ? null : finJson  as FinData,
        sale:   saleJson?.empty || saleJson?.error ? null : saleJson as SaleData,
        config: cfgJson?.error  ? null : cfgJson   as ConfigData,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: String(e) }));
    }
  }, [tenantId, period, finPeriod, salePeriod]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
