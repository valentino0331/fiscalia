import { describe, it, expect } from 'vitest';

describe('Subscription & Plan Limits Logic', () => {
  it('identifies junior and normal plans as capped plans', () => {
    const isJuniorPlan = (plan: string) => plan === 'junior' || plan === 'normal';

    expect(isJuniorPlan('junior')).toBe(true);
    expect(isJuniorPlan('normal')).toBe(true);
    expect(isJuniorPlan('pro')).toBe(false);
    expect(isJuniorPlan('senior')).toBe(false);
    expect(isJuniorPlan('pro-trial')).toBe(false);
  });

  it('correctly calculates the month key format for usage tracking', () => {
    const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

    const dateJan = new Date(2026, 0, 15);
    expect(getMonthKey(dateJan)).toBe('2026-0');

    const dateDec = new Date(2026, 11, 31);
    expect(getMonthKey(dateDec)).toBe('2026-11');
  });

  it('accurately evaluates subscription expiration against current timestamp', () => {
    const isExpired = (currentPeriodEnd: Date | null, referenceNow: Date) => {
      if (!currentPeriodEnd) return false;
      return currentPeriodEnd < referenceNow;
    };

    const now = new Date('2026-09-17T12:00:00Z');
    const futureDate = new Date('2026-10-17T12:00:00Z');
    const pastDate = new Date('2026-08-17T12:00:00Z');

    expect(isExpired(futureDate, now)).toBe(false);
    expect(isExpired(pastDate, now)).toBe(true);
    expect(isExpired(null, now)).toBe(false);
  });

  it('calculates remaining days accurately', () => {
    const calculateDaysRemaining = (currentPeriodEnd: Date | null, referenceNow: Date) => {
      if (!currentPeriodEnd) return 0;
      return Math.max(0, Math.ceil((currentPeriodEnd.getTime() - referenceNow.getTime()) / (1000 * 60 * 60 * 24)));
    };

    const now = new Date('2026-09-17T12:00:00Z');
    const endIn5Days = new Date('2026-09-22T12:00:00Z');
    const expired2DaysAgo = new Date('2026-09-15T12:00:00Z');

    expect(calculateDaysRemaining(endIn5Days, now)).toBe(5);
    expect(calculateDaysRemaining(expired2DaysAgo, now)).toBe(0);
  });

  it('correctly maps Hotmart webhook payloads to Junior or Senior plan', () => {
    const resolvePlan = (planName?: string, offer?: string, price?: number): 'junior' | 'senior' => {
      const p = String(planName || '').toLowerCase().trim();
      const o = String(offer || '').toLowerCase().trim();
      const pr = Number(price || 0);
      return (o === 'ayixxvun' || p.includes('senior') || o.includes('senior') || pr >= 60) ? 'senior' : 'junior';
    };

    expect(resolvePlan('Junior', 'oferta_junior', 39)).toBe('junior');
    expect(resolvePlan('Senior', 'oferta_senior', 69)).toBe('senior');
    expect(resolvePlan('', 'hm1anfcw', 0)).toBe('junior');
    expect(resolvePlan('', 'ayixxvun', 0)).toBe('senior');
    expect(resolvePlan('', '', 39)).toBe('junior');
    expect(resolvePlan('', '', 69)).toBe('senior');
    expect(resolvePlan('Plan Junior Abogados', '', 0)).toBe('junior');
    expect(resolvePlan('Plan Senior Ilimitado', '', 0)).toBe('senior');
  });

  it('determines individual user billing cycle start (30 days from purchase) regardless of calendar month boundary', () => {
    const getPeriodStart = (currentPeriodStart: Date | null, currentPeriodEnd: Date | null, createdAt: Date) => {
      if (currentPeriodStart) return currentPeriodStart;
      if (currentPeriodEnd) return new Date(currentPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      return createdAt;
    };

    // User purchased on Sept 21 -> expires Oct 21. On Oct 1st, their period start is still Sept 21
    const purchaseDate = new Date('2026-09-21T10:00:00Z');
    const expiryDate = new Date('2026-10-21T10:00:00Z');
    const start = getPeriodStart(purchaseDate, expiryDate, purchaseDate);

    expect(start.toISOString()).toBe('2026-09-21T10:00:00.000Z');

    // A question made on Sept 25 falls inside the cycle
    const questionDate = new Date('2026-09-25T14:00:00Z');
    expect(questionDate >= start).toBe(true);

    // User purchased on Sept 28 -> expires Oct 28
    const purchase28 = new Date('2026-09-28T10:00:00Z');
    const expiry28 = new Date('2026-10-28T10:00:00Z');
    const start28 = getPeriodStart(null, expiry28, purchase28);
    expect(start28.toISOString()).toBe('2026-09-28T10:00:00.000Z');
  });

  it('correctly evaluates demo plan limit of 1 consultation and blocks further queries', () => {
    const getPlanLimit = (plan: string) => {
      if (plan === 'demo') return 1;
      if (plan === 'junior' || plan === 'normal') return 50;
      return 250;
    };

    expect(getPlanLimit('demo')).toBe(1);
    expect(getPlanLimit('junior')).toBe(50);
    expect(getPlanLimit('senior')).toBe(250);

    const isLimitExceeded = (plan: string, used: number) => {
      const limit = getPlanLimit(plan);
      return used >= limit;
    };

    // 0 questions used: allowed
    expect(isLimitExceeded('demo', 0)).toBe(false);
    // 1 question used: blocked!
    expect(isLimitExceeded('demo', 1)).toBe(true);
    // 2 questions used: blocked!
    expect(isLimitExceeded('demo', 2)).toBe(true);
  });
});
