import { supabase } from './supabaseClient';
import { claimTypeLabels } from '../constants/claimTypes';
import { daysBetweenLocal } from '../utils/dateUtils';
import { isFinalizedClaim, type ClaimTypeLetter } from './claimsService';

export type ClaimStatsRow = {
  id: number;
  type: string | null;
  amount_agreed: number | null;
  created_at: string;
  presentation_date: string | null;
  finished_at: string | null;
  companies: { id: string; name: string; logo_url: string | null } | null;
  claim_statuses: { id: string; name: string; color: string | null } | null;
};

export type StatusStat = {
  id: string;
  name: string;
  color: string | null;
  count: number;
};

export type CompanyStat = {
  id: string;
  name: string;
  logoUrl: string | null;
  count: number;
  finalized: number;
  closingSamples: number;
  avgCloseDays: number | null;
};

export type TypeStat = {
  type: string;
  label: string;
  count: number;
};

export type CompanyClosingBenchmark = {
  company_id: string;
  company_name: string;
  total_claims: number;
  finalized_claims: number;
  avg_close_days: number | null;
};

export type ProducerStatistics = {
  total: number;
  active: number;
  finalized: number;
  withAgreement: number;
  recentLast30Days: number;
  avgCloseDaysOverall: number | null;
  agreementRatePercent: number | null;
  byStatus: StatusStat[];
  byCompany: CompanyStat[];
  byType: TypeStat[];
};

function getClosingDays(claim: { presentation_date: string | null; finished_at: string | null }): number | null {
  if (!claim.presentation_date || !claim.finished_at) return null;
  return daysBetweenLocal(claim.presentation_date, claim.finished_at);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function buildProducerStatistics(claims: ClaimStatsRow[]): ProducerStatistics {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const statusMap = new Map<string, StatusStat>();
  const companyMap = new Map<string, CompanyStat & { closeDays: number[] }>();
  const typeMap = new Map<string, TypeStat>();

  let active = 0;
  let finalized = 0;
  let withAgreement = 0;
  let recentLast30Days = 0;
  const allCloseDays: number[] = [];

  for (const claim of claims) {
    const status = claim.claim_statuses;
    if (status) {
      const existing = statusMap.get(status.id);
      if (existing) existing.count += 1;
      else statusMap.set(status.id, { id: status.id, name: status.name, color: status.color, count: 1 });
    }

    if (isFinalizedClaim(claim)) finalized += 1;
    else active += 1;

    if (claim.amount_agreed != null && claim.amount_agreed > 0) {
      withAgreement += 1;
    }

    if (new Date(claim.created_at).getTime() >= thirtyDaysAgo) {
      recentLast30Days += 1;
    }

    const company = claim.companies;
    if (company) {
      let row = companyMap.get(company.id);
      if (!row) {
        row = {
          id: company.id,
          name: company.name,
          logoUrl: company.logo_url,
          count: 0,
          finalized: 0,
          closingSamples: 0,
          avgCloseDays: null,
          closeDays: [],
        };
        companyMap.set(company.id, row);
      }
      row.count += 1;
      const closingDays = getClosingDays(claim);
      if (claim.finished_at) {
        row.finalized += 1;
      }
      if (closingDays != null) {
        row.closeDays.push(closingDays);
        allCloseDays.push(closingDays);
      }
    }

    const typeKey = claim.type ?? '—';
    const label =
      claim.type && claimTypeLabels[claim.type as ClaimTypeLetter]
        ? claimTypeLabels[claim.type as ClaimTypeLetter]
        : typeKey;
    const typeRow = typeMap.get(typeKey);
    if (typeRow) typeRow.count += 1;
    else typeMap.set(typeKey, { type: typeKey, label, count: 1 });
  }

  const byCompany: CompanyStat[] = [...companyMap.values()]
    .map(({ closeDays, ...rest }) => ({
      ...rest,
      closingSamples: closeDays.length,
      avgCloseDays: average(closeDays),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total: claims.length,
    active,
    finalized,
    withAgreement,
    recentLast30Days,
    avgCloseDaysOverall: average(allCloseDays),
    agreementRatePercent:
      claims.length > 0 ? Math.round((withAgreement / claims.length) * 1000) / 10 : null,
    byStatus: [...statusMap.values()].sort((a, b) => b.count - a.count),
    byCompany,
    byType: [...typeMap.values()].sort((a, b) => b.count - a.count),
  };
}

export async function getProducerClaimsForStats(userId: string): Promise<{
  data: ClaimStatsRow[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from('claims')
    .select(
      `
      id,
      type,
      amount_agreed,
      created_at,
      presentation_date,
      finished_at,
      companies!company_id (
        id,
        name,
        logo_url
      ),
      claim_statuses (
        id,
        name,
        color
      ),
      producers!inner (
        user_id
      )
    `
    )
    .eq('producers.user_id', userId);

  if (error) return { data: null, error: { message: error.message } };
  return { data: (data as unknown as ClaimStatsRow[]) ?? [], error: null };
}

export async function getCompanyClosingBenchmarks(): Promise<{
  data: CompanyClosingBenchmark[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase.rpc('get_company_closing_stats');

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data: (data as CompanyClosingBenchmark[]) ?? [], error: null };
}
