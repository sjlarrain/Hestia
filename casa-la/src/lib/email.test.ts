import { afterEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn().mockResolvedValue({ data: { id: 'resend-1' }, error: null }) }));

vi.mock('resend', () => ({
  Resend: class FakeResend {
    emails = { send: sendMock };
  },
}));

import { sendAndLog } from './email';
import type { CasaEmail } from './types';

const email: CasaEmail = {
  id: 'email-1',
  to: 'nadia@example.com',
  subject: 'Your stay in Los Angeles is confirmed',
  body: 'Hi Nadia,\n\nSee you soon!',
  tag: 'Approved',
  tagColor: '#2F5A3A',
  at: Date.now(),
};

function mkServiceClient(insertResult: { error: { message: string } | null } = { error: null }) {
  const insert = vi.fn().mockResolvedValue(insertResult);
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as unknown as import('@supabase/supabase-js').SupabaseClient, insert, from };
}

describe('sendAndLog', () => {
  const originalKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    sendMock.mockClear();
  });

  it('sends via Resend and mirrors the email into email_log when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    const { client, from, insert } = mkServiceClient();

    await sendAndLog(client, email, 'approved');

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: email.to, subject: email.subject, text: email.body })
    );
    expect(from).toHaveBeenCalledWith('email_log');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ to_email: email.to, kind: 'approved', subject: email.subject, body: email.body })
    );
  });

  it('skips the actual send but still logs when RESEND_API_KEY is unset (local/dev)', async () => {
    delete process.env.RESEND_API_KEY;
    const { client, insert } = mkServiceClient();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await sendAndLog(client, email, 'approved');

    expect(sendMock).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs to the console but does not throw if the email_log insert fails', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    const { client } = mkServiceClient({ error: { message: 'db unreachable' } });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendAndLog(client, email, 'approved')).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('email_log'), 'db unreachable');
    errorSpy.mockRestore();
  });
});
