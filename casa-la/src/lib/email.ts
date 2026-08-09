import "server-only";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CasaEmail } from "./types";

const FROM = process.env.CASA_EMAIL_FROM || "Casa LA <notifications@casa.la>";

/** Sends via Resend if configured; otherwise logs a warning and no-ops (local/dev). */
async function dispatch(email: Pick<CasaEmail, "to" | "subject" | "body">): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${email.to}: ${email.subject}`);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({ from: FROM, to: email.to, subject: email.subject, text: email.body });
}

/** Sends the notification and mirrors it into email_log (via the service-role client). */
export async function sendAndLog(service: SupabaseClient, email: CasaEmail, kind: "request" | "approved" | "rejected"): Promise<void> {
  await dispatch(email);
  const { error } = await service.from("email_log").insert({
    to_email: email.to,
    kind,
    subject: email.subject,
    body: email.body,
  });
  if (error) console.error("[email] failed to write email_log:", error.message);
}
