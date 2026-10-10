// Supabase Edge Function: weekly-report
//
// Emails the last 7 days of stays to every recipient in the `settings` table
// (owner_email + recipient_emails) as an Excel attachment, via Resend.
//
// Included rows: status 'active' or 'completed' whose time_in is in the last
// 7 days. Reservations (scheduled) and cancelled bookings are left out — this
// is the same rule the in-app Reports tab uses.
//
// Deploy:    supabase functions deploy weekly-report
// Secrets:   supabase secrets set RESEND_API_KEY=re_xxx \
//              SENDER_EMAIL="Mamela's Inn <reports@yourdomain.com>"
//            optional: REPORT_TIMEZONE=Asia/Manila  CRON_SECRET=some-long-random-string
// Schedule:  Dashboard -> Edge Functions -> weekly-report -> Schedules
//            (or supabase/cron/weekly_report.sql.template)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// If CRON_SECRET is set, callers must also send header  x-cron-secret: <value>.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';

interface Txn {
  ref: string;
  guest_name: string;
  room_ids: string[];
  hours: number;
  time_in: string;
  time_out: string;
  payment_method: string;
  total_amount: number;
  status: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

Deno.serve(async (req) => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ error: 'RESEND_API_KEY secret is not set.' }, 500);
    const sender = Deno.env.get('SENDER_EMAIL') ?? "Mamela's Inn <onboarding@resend.dev>";
    const tz = Deno.env.get('REPORT_TIMEZONE') ?? 'Asia/Manila';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [txnRes, settingsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .in('status', ['active', 'completed'])
        .gte('time_in', since)
        .order('time_in', { ascending: false })
        .limit(10000),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (txnRes.error) throw txnRes.error;
    if (settingsRes.error) throw settingsRes.error;

    const settings = settingsRes.data;
    const recipients = [
      ...new Set([settings?.owner_email, ...(settings?.recipient_emails ?? [])].filter(Boolean)),
    ] as string[];
    if (recipients.length === 0) {
      return json({ skipped: true, reason: 'No recipient emails configured in Admin Settings.' });
    }

    const rows = (txnRes.data ?? []) as Txn[];
    const fmt = (iso: string) => new Date(iso).toLocaleString('en-PH', { timeZone: tz });
    const sheetRows = rows.map((t) => ({
      'Reference #': t.ref,
      'Date & Time In': fmt(t.time_in),
      'Date & Time Out': fmt(t.time_out),
      'Guest Name': t.guest_name,
      'Room(s)': t.room_ids.join(', '),
      'Duration (hrs)': Number(t.hours),
      'Payment Method': t.payment_method,
      'Total Amount': Number(t.total_amount),
      Status: t.status === 'active' ? 'Active' : 'Completed',
    }));

    // Excel attachment (falls back to CSV if the spreadsheet library misbehaves).
    const stamp = new Date().toISOString().slice(0, 10);
    let attachment: { filename: string; content: string };
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Last 7 Days');
      attachment = {
        filename: `weekly-report-${stamp}.xlsx`,
        content: XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }),
      };
    } catch {
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(sheetRows));
      attachment = {
        filename: `weekly-report-${stamp}.csv`,
        content: btoa(unescape(encodeURIComponent(csv))),
      };
    }

    const revenue = rows.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0);
    const innName = escapeHtml(settings?.inn_name ?? "Mamela's Inn");

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: recipients,
        subject: `${settings?.inn_name ?? "Mamela's Inn"} — Weekly Transaction Report`,
        html: `
          <p>Hi,</p>
          <p>Here is the ${innName} report for the past 7 days.</p>
          <ul>
            <li><strong>Stays:</strong> ${rows.length}</li>
            <li><strong>Total revenue:</strong> ₱${revenue.toLocaleString('en-PH')}</li>
          </ul>
          <p>The full breakdown is attached as a spreadsheet.</p>`,
        attachments: [attachment],
      }),
    });

    if (!emailRes.ok) {
      throw new Error(`Resend API error (${emailRes.status}): ${await emailRes.text()}`);
    }
    return json({ sent: true, recipients, stays: rows.length });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
