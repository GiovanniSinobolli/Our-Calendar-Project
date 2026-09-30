import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function buildEmailSummary(
  body: Record<string, unknown>,
  eventType: 'created' | 'updated'
): string {
  const activity = body.activity as string;
  const scheduleDate = new Date(body.schedule as string);
  const formatted = scheduleDate.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  let details = '';
  if (activity === 'eat') details = `Eating: ${body.eatChoice}`;
  if (activity === 'outside')
    details = `Going outside: ${(body.outsideChoice as string[])?.join(', ')}`;
  if (activity === 'movie')
    details = `Movie at ${body.movieLocation}, genre: ${body.movieGenre}`;

  const note = body.note ? `\nNote: ${body.note}` : '';
  const heading =
    eventType === 'created' ? 'New date scheduled!' : 'A date was updated!';

  return `${heading}\n\nActivity: ${activity}\n${details}\nWhen: ${formatted}${note}`;
}

export function notifyAppointmentChange(
  body: Record<string, unknown>,
  eventType: 'created' | 'updated'
) {
  if (!process.env.NOTIFY_EMAIL) return;

  const subject =
    eventType === 'created' ? 'New date scheduled!' : 'Your date was updated.';

  // Fire-and-forget: a failed email shouldn't block the appointment
  // create/update from succeeding.
  resend.emails
    .send({
      from: 'Date Planner <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL,
      subject,
      text: buildEmailSummary(body, eventType),
    })
    .catch((err) => {
      console.error(`Failed to send "${eventType}" notification email:`, err);
    });
}