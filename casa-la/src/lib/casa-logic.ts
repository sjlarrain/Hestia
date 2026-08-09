import type { Application, AppStatus, Block, CasaData, CasaEmail, EmailKind, PartyGuest } from './types';

// ---------- ids ----------
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ---------- date helpers ----------
// Dates are plain calendar days (YYYY-MM-DD). We deliberately avoid `Date` arithmetic
// that could drift across timezones; comparisons are done as ISO strings, and any
// `Date` object we do construct is pinned to local midnight via the `T00:00:00` suffix.
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return isoOf(new Date());
}

export function isoOffset(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return isoOf(d);
}

export function toDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

export function fmt(iso: string): string {
  if (!iso) return '';
  return toDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtRange(a: string, b: string): string {
  if (a === b || !b) return fmt(a);
  return `${fmt(a)} → ${fmt(b)}`;
}

export function nights(a: string, b: string): string {
  if (!b || a === b) return '1 night';
  const n = Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
  return `${n} ${n === 1 ? 'night' : 'nights'}`;
}

function eachIsoInRange(a: string, b: string): string[] {
  const out: string[] = [];
  const s = toDate(a);
  const e = toDate(b);
  for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(isoOf(d));
  }
  return out;
}

// ---------- availability ----------
export function isBlocked(blocks: Block[], iso: string): boolean {
  return blocks.some((b) => iso >= b.start && iso <= b.end);
}

export function approvedOn(applications: Application[], iso: string): Application[] {
  return applications.filter((a) => a.status === 'approved' && iso >= a.arrival && iso <= a.departure);
}

export function pendingOn(applications: Application[], iso: string): Application[] {
  return applications.filter((a) => a.status === 'pending' && iso >= a.arrival && iso <= a.departure);
}

/** A range is open if no day in it is blocked or covered by an approved application. */
export function rangeOpen(data: Pick<CasaData, 'applications' | 'blocks'>, a: string, b: string): boolean {
  for (const iso of eachIsoInRange(a, b)) {
    if (isBlocked(data.blocks, iso) || approvedOn(data.applications, iso).length) return false;
  }
  return true;
}

// ---------- status ----------
export type StatusMeta = { label: string; fg: string; bg: string };

const STATUS_META: Record<AppStatus, StatusMeta> = {
  draft: { label: 'Draft', fg: '#6B6459', bg: '#ECE7DD' },
  pending: { label: 'Pending', fg: '#8A5A16', bg: '#F6E8CE' },
  approved: { label: 'Approved', fg: '#2F5A3A', bg: '#DCEBDD' },
  rejected: { label: 'Declined', fg: '#8A3529', bg: '#F3DAD5' },
  cancelled: { label: 'Cancelled', fg: '#6B6459', bg: '#ECE7DD' },
};

export function statusMeta(s: AppStatus): StatusMeta {
  return STATUS_META[s] || STATUS_META.draft;
}

// ---------- validation ----------
export type DraftApplication = {
  id: string | null;
  name: string;
  email: string;
  arrival: string;
  departure: string;
  people: number;
  guests: PartyGuest[];
};

/**
 * Re-checked server-side on submit/approve too: the calendar can go stale between
 * a guest selecting a range and the host approving it, so never trust the client.
 */
export function validateApplication(data: Pick<CasaData, 'applications' | 'blocks'>, f: DraftApplication): string {
  if (!f.name.trim()) return 'Please add your name.';
  if (!/.+@.+\..+/.test(f.email)) return 'Please add a valid email.';
  if (!f.arrival || !f.departure) return 'Please choose your dates.';
  if (f.departure < f.arrival) return "Departure can't be before arrival.";
  if (!rangeOpen(data, f.arrival, f.departure)) {
    // Allow the application's own currently-approved range when editing itself.
    const others = data.applications.filter((a) => a.id !== f.id);
    for (const iso of eachIsoInRange(f.arrival, f.departure)) {
      if (isBlocked(data.blocks, iso)) return 'Some of those dates are blocked.';
      if (others.some((a) => a.status === 'approved' && iso >= a.arrival && iso <= a.departure)) {
        return 'Some of those dates are already booked.';
      }
    }
  }
  return '';
}

export type DraftBlock = { start: string; end: string; reason: string };

export function validateBlock(b: DraftBlock): string {
  if (!b.start || !b.end) return 'Please choose both dates.';
  if (b.end < b.start) return "End date can't be before start.";
  return '';
}

// ---------- email copy ----------
export function hostEmailAddress(hostName: string | undefined): string {
  return `${(hostName || 'Host').split(' ')[0].toLowerCase()}@casa.la`;
}

export function makeEmail(kind: EmailKind, app: Application, hostName: string | undefined): CasaEmail {
  const host = hostName || 'your host';
  const range = fmtRange(app.arrival, app.departure);
  let to: string, subject: string, body: string, tag: string, tagColor: string;

  if (kind === 'request') {
    to = hostEmailAddress(hostName);
    tag = 'New request';
    tagColor = '#8A5A16';
    subject = `New visit request — ${app.name}`;
    body =
      `${app.name} has requested to stay.\n\n` +
      `Dates:  ${range}\n` +
      `Guests:  ${app.people} ${app.people === 1 ? 'person' : 'people'}\n` +
      `Email:  ${app.email}` +
      (app.guests.length ? `\nParty:  ${app.guests.map((g) => g.name || g.email).join(', ')}` : '') +
      `\n\nOpen Casa to approve or decline this request.`;
  } else if (kind === 'approved') {
    to = app.email;
    tag = 'Approved';
    tagColor = '#2F5A3A';
    subject = 'Your stay in Los Angeles is confirmed';
    body =
      `Hi ${app.name},\n\n` +
      `Great news — ${host} has confirmed your visit.\n\n` +
      `Arrival:  ${fmt(app.arrival)}\n` +
      `Departure:  ${fmt(app.departure)}\n` +
      `Guests:  ${app.people}\n\n` +
      `We can't wait to see you. See you soon!`;
  } else {
    to = app.email;
    tag = 'Declined';
    tagColor = '#8A3529';
    subject = 'Update on your visit request';
    body =
      `Hi ${app.name},\n\n` +
      `Thank you for your request for ${range}. Unfortunately those dates won't work this time.\n\n` +
      `Please feel free to open Casa and choose another period — we'd love to have you.\n\n` +
      `Warmly,\n${host}`;
  }

  return { id: uid(), to, subject, body, tag, tagColor, at: Date.now() };
}

// ---------- calendar grid ----------
export type CalendarCell = {
  key: string;
  iso: string | null;
  label: string;
  empty: boolean;
  past: boolean;
  blocked: boolean;
  approved: boolean;
  pending: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  clickable: boolean;
};

export type Selection = { start: string | null; end: string | null };

/** Pure month-grid builder: no styling, no event handlers — just per-day facts. */
export function buildMonthCells(
  data: Pick<CasaData, 'applications' | 'blocks'>,
  monthY: number,
  monthM: number,
  sel: Selection
): CalendarCell[] {
  const first = new Date(monthY, monthM, 1);
  const lead = first.getDay();
  const days = new Date(monthY, monthM + 1, 0).getDate();
  const t = today();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < lead; i++) {
    cells.push({
      key: 'b' + i,
      iso: null,
      label: '',
      empty: true,
      past: false,
      blocked: false,
      approved: false,
      pending: false,
      isStart: false,
      isEnd: false,
      inRange: false,
      clickable: false,
    });
  }

  for (let d = 1; d <= days; d++) {
    const iso = `${monthY}-${pad(monthM + 1)}-${pad(d)}`;
    const past = iso < t;
    const blocked = isBlocked(data.blocks, iso);
    const approved = approvedOn(data.applications, iso).length > 0;
    const pending = pendingOn(data.applications, iso).length > 0;
    let isStart = false;
    let isEnd = false;
    let inRange = false;
    if (sel.start && sel.end) {
      isStart = iso === sel.start;
      isEnd = iso === sel.end;
      inRange = iso > sel.start && iso < sel.end;
    } else if (sel.start) {
      isStart = iso === sel.start;
    }
    const clickable = !past && !blocked && !approved;
    cells.push({ key: iso, iso, label: String(d), empty: false, past, blocked, approved, pending, isStart, isEnd, inRange, clickable });
  }

  return cells;
}

// ---------- seed data (local/dev mode only) ----------
export function seedData(): CasaData {
  const mk = (o: Partial<Application> & Pick<Application, 'name' | 'email' | 'arrival' | 'departure' | 'people' | 'status'>): Application =>
    Object.assign({ id: uid(), guests: [], mine: false }, o);
  return {
    applications: [
      mk({ name: 'Nadia Alvarez', email: 'nadia@email.com', arrival: isoOffset(-1), departure: isoOffset(3), people: 2, status: 'approved' }),
      mk({ name: 'Elena Ruiz', email: 'elena@email.com', arrival: isoOffset(18), departure: isoOffset(24), people: 2, status: 'approved' }),
      mk({ name: 'Marco Ruiz', email: 'marco@email.com', arrival: isoOffset(31), departure: isoOffset(35), people: 3, status: 'pending' }),
      mk({
        name: 'You',
        email: 'me@email.com',
        arrival: isoOffset(46),
        departure: isoOffset(50),
        people: 2,
        status: 'pending',
        mine: true,
        guests: [{ name: 'Sam', email: 'sam@email.com' }],
      }),
    ],
    blocks: [{ id: uid(), start: isoOffset(6), end: isoOffset(12), reason: 'Away for work' }],
    emails: [],
  };
}
