import { count, desc, eq, gte } from "drizzle-orm";
import { getDb, hasDatabase } from "@/lib/db";
import { checkCompletions, checkGroups, checkResponses, type CheckGroup, type CheckResponse } from "@/lib/db/schema";
import type { AreaKey } from "@/lib/diagnostic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 참여 링크(공개)로 접근하는 활성 조직 진단 그룹.
export async function getCheckGroupByCode(code: string): Promise<CheckGroup | null> {
  if (!hasDatabase) return null;
  const [group] = await getDb()
    .select()
    .from(checkGroups)
    .where(eq(checkGroups.code, code))
    .limit(1);
  if (!group || !group.active) return null;
  return group;
}

export interface CheckGroupWithCount extends CheckGroup {
  responseCount: number;
}

export async function getCheckTotals(): Promise<{
  individualCount: number;
  orgResponseCount: number;
  total: number;
  last30Days: number;
}> {
  if (!hasDatabase) {
    return { individualCount: 0, orgResponseCount: 0, total: 0, last30Days: 0 };
  }

  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [individualTotal, orgTotal, recentIndividualTotal, recentOrgTotal] = await Promise.all([
    db.select({ value: count() }).from(checkCompletions),
    db.select({ value: count() }).from(checkResponses),
    db.select({ value: count() }).from(checkCompletions).where(gte(checkCompletions.createdAt, thirtyDaysAgo)),
    db.select({ value: count() }).from(checkResponses).where(gte(checkResponses.createdAt, thirtyDaysAgo))
  ]);
  const individualCount = individualTotal[0]?.value ?? 0;
  const orgResponseCount = orgTotal[0]?.value ?? 0;

  return {
    individualCount,
    orgResponseCount,
    total: individualCount + orgResponseCount,
    last30Days: (recentIndividualTotal[0]?.value ?? 0) + (recentOrgTotal[0]?.value ?? 0)
  };
}

// 관리자 목록: 그룹 + 응답 수.
export async function getCheckGroupsWithCounts(): Promise<CheckGroupWithCount[]> {
  if (!hasDatabase) return [];
  const db = getDb();
  const groups = await db.select().from(checkGroups).orderBy(desc(checkGroups.createdAt));
  const responses = await db
    .select({ groupId: checkResponses.groupId })
    .from(checkResponses);
  const counts = new Map<string, number>();
  for (const row of responses) {
    counts.set(row.groupId, (counts.get(row.groupId) ?? 0) + 1);
  }
  return groups.map((group) => ({ ...group, responseCount: counts.get(group.id) ?? 0 }));
}

export async function getCheckGroupById(id: string): Promise<CheckGroup | null> {
  if (!hasDatabase) return null;
  if (!UUID_RE.test(id)) return null;
  const [group] = await getDb().select().from(checkGroups).where(eq(checkGroups.id, id)).limit(1);
  return group ?? null;
}

export async function getGroupResponses(groupId: string): Promise<CheckResponse[]> {
  if (!hasDatabase) return [];
  return getDb()
    .select()
    .from(checkResponses)
    .where(eq(checkResponses.groupId, groupId))
    .orderBy(desc(checkResponses.createdAt));
}

export async function getResponseById(id: string): Promise<CheckResponse | null> {
  if (!hasDatabase || !UUID_RE.test(id)) return null;
  const [response] = await getDb().select().from(checkResponses).where(eq(checkResponses.id, id)).limit(1);
  return response ?? null;
}

export interface GroupStats {
  n: number;
  avgValidAverage: number;
  levelDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  areaAverages: Record<AreaKey, number | null>;
  lowestArea: AreaKey | null;
  eSafeRate: number; // E >= 21 비율 (0~1)
  gatePassRate: number; // gateCount === 0 비율 (0~1)
  dApplicableCount: number; // D 적용자 수
  dReadyRate: number | null; // D 적용자 중 scoreD >= 21 비율, 적용자 없으면 null
  roleDistribution: { role: string; count: number }[];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// 그룹의 모든 응답에서 조직 통계를 계산한다.
export async function getGroupStats(groupId: string): Promise<GroupStats> {
  const empty: GroupStats = {
    n: 0,
    avgValidAverage: 0,
    levelDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    areaAverages: { A: null, B: null, C: null, D: null, E: null },
    lowestArea: null,
    eSafeRate: 0,
    gatePassRate: 0,
    dApplicableCount: 0,
    dReadyRate: null,
    roleDistribution: []
  };
  if (!hasDatabase) return empty;

  const rows = await getDb()
    .select()
    .from(checkResponses)
    .where(eq(checkResponses.groupId, groupId));

  const n = rows.length;
  if (n === 0) return empty;

  const levelDistribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const areaSums: Record<AreaKey, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const areaCounts: Record<AreaKey, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  let eSafeCount = 0;
  let gatePassCount = 0;
  let dApplicableCount = 0;
  let dReadyCount = 0;
  const roleCounts = new Map<string, number>();

  for (const r of rows as CheckResponse[]) {
    const lvl = r.finalLevel as 1 | 2 | 3 | 4 | 5;
    if (lvl >= 1 && lvl <= 5) levelDistribution[lvl] += 1;

    areaSums.A += r.scoreA;
    areaCounts.A += 1;
    areaSums.B += r.scoreB;
    areaCounts.B += 1;
    areaSums.C += r.scoreC;
    areaCounts.C += 1;
    areaSums.E += r.scoreE;
    areaCounts.E += 1;

    if (r.dApplicable && r.scoreD !== null) {
      areaSums.D += r.scoreD;
      areaCounts.D += 1;
      dApplicableCount += 1;
      if (r.scoreD >= 21) dReadyCount += 1;
    }

    if (r.scoreE >= 21) eSafeCount += 1;
    if (r.gateCount === 0) gatePassCount += 1;

    const role = (r.role ?? "").trim() || "미응답";
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }

  const areaAverages: Record<AreaKey, number | null> = {
    A: areaCounts.A > 0 ? round1(areaSums.A / areaCounts.A) : null,
    B: areaCounts.B > 0 ? round1(areaSums.B / areaCounts.B) : null,
    C: areaCounts.C > 0 ? round1(areaSums.C / areaCounts.C) : null,
    D: areaCounts.D > 0 ? round1(areaSums.D / areaCounts.D) : null,
    E: areaCounts.E > 0 ? round1(areaSums.E / areaCounts.E) : null
  };

  let lowestArea: AreaKey | null = null;
  let lowestValue = Infinity;
  for (const key of ["A", "B", "C", "D", "E"] as AreaKey[]) {
    const avg = areaAverages[key];
    if (avg !== null && avg < lowestValue) {
      lowestValue = avg;
      lowestArea = key;
    }
  }

  const roleDistribution = [...roleCounts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  const avgValidAverage = Math.round((rows.reduce((sum, r) => sum + r.validAverage, 0) / n) * 10) / 10;

  return {
    n,
    avgValidAverage,
    levelDistribution,
    areaAverages,
    lowestArea,
    eSafeRate: eSafeCount / n,
    gatePassRate: gatePassCount / n,
    dApplicableCount,
    dReadyRate: dApplicableCount > 0 ? dReadyCount / dApplicableCount : null,
    roleDistribution
  };
}
