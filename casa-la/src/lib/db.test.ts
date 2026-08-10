import { describe, expect, it } from 'vitest';
import { isRangeOpenDb, toApplication, type ApplicationGuestRow, type ApplicationRow } from './db';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Minimal thenable query-builder fake: every chain method (select/eq/lte/gte/
 * neq/limit/order/in) returns `this`, and awaiting the chain resolves to a
 * preset `{ data, error }` — enough to exercise isRangeOpenDb's two queries
 * without a live Postgres instance.
 */
function fakeBuilder(result: { data: unknown; error: { message: string } | null }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'lte', 'gte', 'neq', 'limit', 'order', 'in']) {
    builder[method] = () => builder;
  }
  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

function fakeService(byTable: Record<string, { data: unknown; error: { message: string } | null }>) {
  const from = (table: string) => fakeBuilder(byTable[table] ?? { data: [], error: null });
  return { from } as unknown as SupabaseClient;
}

function mkRow(overrides: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    id: 'app-1',
    user_id: 'user-1',
    name: 'Nadia Alvarez',
    email: 'nadia@example.com',
    arrival: '2026-03-01',
    departure: '2026-03-05',
    people: 2,
    status: 'approved',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('toApplication', () => {
  it('maps a DB row to the shared Application shape', () => {
    const app = toApplication(mkRow(), [], 'user-1');
    expect(app).toMatchObject({
      id: 'app-1',
      name: 'Nadia Alvarez',
      email: 'nadia@example.com',
      arrival: '2026-03-01',
      departure: '2026-03-05',
      people: 2,
      status: 'approved',
      guests: [],
      mine: true,
    });
  });

  it('sets mine=false when the row belongs to a different user', () => {
    const app = toApplication(mkRow({ user_id: 'someone-else' }), [], 'user-1');
    expect(app.mine).toBe(false);
  });

  it('sets mine=false when no current user id is supplied', () => {
    const app = toApplication(mkRow(), []);
    expect(app.mine).toBe(false);
  });

  it('only attaches guests belonging to this application, and fills missing name/email with empty strings', () => {
    const guests: ApplicationGuestRow[] = [
      { id: 'g1', application_id: 'app-1', name: 'Sam', email: null },
      { id: 'g2', application_id: 'app-1', name: null, email: 'jo@example.com' },
      { id: 'g3', application_id: 'other-app', name: 'Not this one', email: 'x@example.com' },
    ];
    const app = toApplication(mkRow(), guests, 'user-1');
    expect(app.guests).toEqual([
      { name: 'Sam', email: '' },
      { name: '', email: 'jo@example.com' },
    ]);
  });
});

describe('isRangeOpenDb', () => {
  it('is open when neither query finds a hit', async () => {
    const service = fakeService({
      blocks: { data: [], error: null },
      applications: { data: [], error: null },
    });
    await expect(isRangeOpenDb(service, '2026-03-01', '2026-03-05')).resolves.toBe(true);
  });

  it('is closed when a block overlaps', async () => {
    const service = fakeService({
      blocks: { data: [{ id: 'b1' }], error: null },
      applications: { data: [], error: null },
    });
    await expect(isRangeOpenDb(service, '2026-03-01', '2026-03-05')).resolves.toBe(false);
  });

  it('is closed when an approved application overlaps', async () => {
    const service = fakeService({
      blocks: { data: [], error: null },
      applications: { data: [{ id: 'a1' }], error: null },
    });
    await expect(isRangeOpenDb(service, '2026-03-01', '2026-03-05')).resolves.toBe(false);
  });

  it('throws if the blocks query errors', async () => {
    const service = fakeService({
      blocks: { data: null, error: { message: 'connection lost' } },
      applications: { data: [], error: null },
    });
    await expect(isRangeOpenDb(service, '2026-03-01', '2026-03-05')).rejects.toThrow('connection lost');
  });
});
