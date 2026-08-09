import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMonthCells,
  fmt,
  fmtRange,
  isBlocked,
  approvedOn,
  pendingOn,
  isoOf,
  isoOffset,
  makeEmail,
  nights,
  rangeOpen,
  seedData,
  statusMeta,
  today,
  toDate,
  uid,
  validateApplication,
  validateBlock,
} from './casa-logic';
import type { Application, Block, CasaData } from './types';

// Pin "today" to a fixed local midnight so date-offset helpers are deterministic.
const FIXED_TODAY = new Date(2026, 0, 15); // 2026-01-15, local time

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

function mkApp(overrides: Partial<Application> & Pick<Application, 'arrival' | 'departure' | 'status'>): Application {
  return {
    id: uid(),
    name: 'Test Guest',
    email: 'guest@example.com',
    people: 1,
    guests: [],
    mine: false,
    ...overrides,
  };
}

function mkBlock(overrides: Partial<Block> & Pick<Block, 'start' | 'end'>): Block {
  return { id: uid(), reason: 'Unavailable', ...overrides };
}

describe('date helpers', () => {
  it('today() reflects the system clock as a local-midnight ISO date', () => {
    expect(today()).toBe('2026-01-15');
  });

  it('isoOffset() shifts by whole calendar days, not 24h windows', () => {
    expect(isoOffset(0)).toBe('2026-01-15');
    expect(isoOffset(1)).toBe('2026-01-16');
    expect(isoOffset(-1)).toBe('2026-01-14');
    expect(isoOffset(20)).toBe('2026-02-04');
  });

  it('isoOf() formats a Date as YYYY-MM-DD with zero-padding', () => {
    expect(isoOf(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('toDate() round-trips through isoOf()', () => {
    expect(isoOf(toDate('2026-07-04'))).toBe('2026-07-04');
  });

  it('fmt() renders a short month/day label', () => {
    expect(fmt('2026-03-05')).toBe('Mar 5');
    expect(fmt('')).toBe('');
  });

  it('fmtRange() collapses a single-day range and arrows a multi-day one', () => {
    expect(fmtRange('2026-03-05', '2026-03-05')).toBe('Mar 5');
    expect(fmtRange('2026-03-05', '')).toBe('Mar 5');
    expect(fmtRange('2026-03-05', '2026-03-09')).toBe('Mar 5 → Mar 9');
  });

  it('nights() counts inclusive-arrival/exclusive-departure nights', () => {
    expect(nights('2026-03-05', '2026-03-05')).toBe('1 night');
    expect(nights('2026-03-05', '')).toBe('1 night');
    expect(nights('2026-03-05', '2026-03-06')).toBe('1 night');
    expect(nights('2026-03-05', '2026-03-09')).toBe('4 nights');
  });
});

describe('availability lookups', () => {
  const blocks = [mkBlock({ start: '2026-02-01', end: '2026-02-05' })];
  const applications = [
    mkApp({ arrival: '2026-03-01', departure: '2026-03-05', status: 'approved' }),
    mkApp({ arrival: '2026-04-01', departure: '2026-04-05', status: 'pending' }),
  ];

  it('isBlocked() is true only inside the inclusive block range', () => {
    expect(isBlocked(blocks, '2026-02-01')).toBe(true);
    expect(isBlocked(blocks, '2026-02-05')).toBe(true);
    expect(isBlocked(blocks, '2026-02-03')).toBe(true);
    expect(isBlocked(blocks, '2026-01-31')).toBe(false);
    expect(isBlocked(blocks, '2026-02-06')).toBe(false);
  });

  it('approvedOn() only matches approved applications covering the date', () => {
    expect(approvedOn(applications, '2026-03-03')).toHaveLength(1);
    expect(approvedOn(applications, '2026-04-03')).toHaveLength(0);
  });

  it('pendingOn() only matches pending applications covering the date', () => {
    expect(pendingOn(applications, '2026-04-03')).toHaveLength(1);
    expect(pendingOn(applications, '2026-03-03')).toHaveLength(0);
  });

  it('rangeOpen() rejects ranges touching a block or an approved application', () => {
    const data: Pick<CasaData, 'applications' | 'blocks'> = { applications, blocks };
    expect(rangeOpen(data, '2026-01-20', '2026-01-25')).toBe(true);
    expect(rangeOpen(data, '2026-01-31', '2026-02-02')).toBe(false); // clips the block
    expect(rangeOpen(data, '2026-02-28', '2026-03-02')).toBe(false); // clips the approved app
    // Pending applications do NOT block others (first-approved-wins).
    expect(rangeOpen(data, '2026-04-01', '2026-04-05')).toBe(true);
  });
});

describe('statusMeta', () => {
  it('returns known labels for each status', () => {
    expect(statusMeta('pending').label).toBe('Pending');
    expect(statusMeta('approved').label).toBe('Approved');
    expect(statusMeta('rejected').label).toBe('Declined');
    expect(statusMeta('cancelled').label).toBe('Cancelled');
    expect(statusMeta('draft').label).toBe('Draft');
  });
});

describe('validateApplication', () => {
  const empty: Pick<CasaData, 'applications' | 'blocks'> = { applications: [], blocks: [] };
  const base = {
    id: null,
    name: 'Nadia',
    email: 'nadia@example.com',
    arrival: '2026-03-01',
    departure: '2026-03-05',
    people: 2,
    guests: [],
  };

  it('requires a name', () => {
    expect(validateApplication(empty, { ...base, name: '  ' })).toMatch(/name/i);
  });

  it('requires a valid email', () => {
    expect(validateApplication(empty, { ...base, email: 'not-an-email' })).toMatch(/email/i);
  });

  it('requires both dates', () => {
    expect(validateApplication(empty, { ...base, arrival: '' })).toMatch(/dates/i);
  });

  it('rejects departure before arrival', () => {
    expect(validateApplication(empty, { ...base, arrival: '2026-03-05', departure: '2026-03-01' })).toMatch(/before arrival/i);
  });

  it('rejects dates inside a block', () => {
    const data = { applications: [], blocks: [mkBlock({ start: '2026-03-02', end: '2026-03-03' })] };
    expect(validateApplication(data, base)).toMatch(/blocked/i);
  });

  it('rejects dates already covered by another approved application', () => {
    const data = {
      applications: [mkApp({ arrival: '2026-03-03', departure: '2026-03-04', status: 'approved' })],
      blocks: [],
    };
    expect(validateApplication(data, base)).toMatch(/already booked/i);
  });

  it('allows editing an application to keep its own already-approved range', () => {
    const existing = mkApp({ id: 'app-1', arrival: '2026-03-01', departure: '2026-03-05', status: 'approved' });
    const data = { applications: [existing], blocks: [] };
    expect(validateApplication(data, { ...base, id: 'app-1' })).toBe('');
  });

  it('passes for a fully open range', () => {
    expect(validateApplication(empty, base)).toBe('');
  });
});

describe('validateBlock', () => {
  it('requires both dates', () => {
    expect(validateBlock({ start: '', end: '2026-03-05', reason: '' })).toMatch(/both dates/i);
  });

  it('rejects end before start', () => {
    expect(validateBlock({ start: '2026-03-05', end: '2026-03-01', reason: '' })).toMatch(/before start/i);
  });

  it('passes for a valid range', () => {
    expect(validateBlock({ start: '2026-03-01', end: '2026-03-05', reason: '' })).toBe('');
  });
});

describe('makeEmail', () => {
  const app = mkApp({
    name: 'Nadia Alvarez',
    email: 'nadia@example.com',
    arrival: '2026-03-01',
    departure: '2026-03-05',
    people: 2,
    status: 'pending',
    guests: [{ name: 'Sam', email: 'sam@example.com' }],
  });

  it('request email goes to the host with dates, headcount and party', () => {
    const email = makeEmail('request', app, 'Alex Host');
    expect(email.to).toBe('alex@casa.la');
    expect(email.subject).toBe('New visit request — Nadia Alvarez');
    expect(email.body).toContain('Mar 1 → Mar 5');
    expect(email.body).toContain('2 people');
    expect(email.body).toContain('Sam');
    expect(email.tag).toBe('New request');
  });

  it('approved email goes to the applicant with a confirmation', () => {
    const email = makeEmail('approved', app, 'Alex Host');
    expect(email.to).toBe('nadia@example.com');
    expect(email.subject).toBe('Your stay in Los Angeles is confirmed');
    expect(email.body).toContain('Alex Host');
    expect(email.tag).toBe('Approved');
  });

  it('rejected email goes to the applicant with an invite to pick another period', () => {
    const email = makeEmail('rejected', app, 'Alex Host');
    expect(email.to).toBe('nadia@example.com');
    expect(email.subject).toBe('Update on your visit request');
    expect(email.body).toMatch(/choose another period/i);
    expect(email.tag).toBe('Declined');
  });
});

describe('buildMonthCells', () => {
  const data: Pick<CasaData, 'applications' | 'blocks'> = {
    applications: [mkApp({ arrival: '2026-01-20', departure: '2026-01-22', status: 'approved' })],
    blocks: [mkBlock({ start: '2026-01-10', end: '2026-01-12' })],
  };

  it('leads with empty cells for days before the 1st and includes every day of the month', () => {
    // Jan 1 2026 is a Thursday -> 4 leading empty cells (Sun..Wed).
    const cells = buildMonthCells(data, 2026, 0, { start: null, end: null });
    const empties = cells.filter((c) => c.empty);
    const days = cells.filter((c) => !c.empty);
    expect(empties).toHaveLength(4);
    expect(days).toHaveLength(31);
    expect(days[0].iso).toBe('2026-01-01');
    expect(days[days.length - 1].iso).toBe('2026-01-31');
  });

  it('marks past, blocked and approved days, and keeps them non-clickable', () => {
    const cells = buildMonthCells(data, 2026, 0, { start: null, end: null });
    const byIso = new Map(cells.filter((c) => c.iso).map((c) => [c.iso as string, c]));
    expect(byIso.get('2026-01-10')?.blocked).toBe(true);
    expect(byIso.get('2026-01-10')?.clickable).toBe(false);
    expect(byIso.get('2026-01-21')?.approved).toBe(true);
    expect(byIso.get('2026-01-21')?.clickable).toBe(false);
    expect(byIso.get('2026-01-14')?.past).toBe(true); // before FIXED_TODAY (Jan 15)
    expect(byIso.get('2026-01-16')?.clickable).toBe(true);
  });

  it('flags start/end/in-range cells for a selection', () => {
    const cells = buildMonthCells(data, 2026, 0, { start: '2026-01-16', end: '2026-01-18' });
    const byIso = new Map(cells.filter((c) => c.iso).map((c) => [c.iso as string, c]));
    expect(byIso.get('2026-01-16')?.isStart).toBe(true);
    expect(byIso.get('2026-01-18')?.isEnd).toBe(true);
    expect(byIso.get('2026-01-17')?.inRange).toBe(true);
    expect(byIso.get('2026-01-19')?.inRange).toBe(false);
  });
});

describe('seedData', () => {
  it('produces a shape the store can round-trip through JSON', () => {
    const data = seedData();
    expect(data.applications.length).toBeGreaterThan(0);
    expect(data.blocks.length).toBeGreaterThan(0);
    expect(data.emails).toEqual([]);
    const roundTripped = JSON.parse(JSON.stringify(data)) as CasaData;
    expect(roundTripped).toEqual(data);
  });
});
