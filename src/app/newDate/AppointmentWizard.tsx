'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { questions, activityRouting } from './Questionflow';
import styles from './newDate.module.css';

type AnswersMap = Record<string, string | string[]>;

type AppointmentWizardProps = {
  mode: 'create' | 'edit';
  appointmentId?: string;
  initialAnswers?: AnswersMap;
  onSaved?: () => void; // called after a successful create/edit, e.g. to close an inline editor
};

export default function AppointmentWizard({
  mode,
  appointmentId,
  initialAnswers,
  onSaved,
}: AppointmentWizardProps) {
  const router = useRouter();

  const [currentKey, setCurrentKey] = useState('activity');
  const [answers, setAnswers] = useState<AnswersMap>(initialAnswers ?? {});
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(initialAnswers?.['outsideChoice'])
      ? (initialAnswers!['outsideChoice'] as string[])
      : []
  );
  const [noteText, setNoteText] = useState(
    typeof initialAnswers?.['note'] === 'string' ? (initialAnswers!['note'] as string) : ''
  );
  const [history, setHistory] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentKey];

  function toggleSelection(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleChoice(value: string) {
    let next: string | undefined;

    if (currentKey === 'activity') {
      next = activityRouting[value];
    } else {
      next = question.next;
    }

    const updated: AnswersMap = { ...answers, [currentKey]: value };
    setAnswers(updated);

    if (next) {
      setHistory((h) => [...h, currentKey]);
      setCurrentKey(next);
    } else {
      submitAppointment(updated);
    }
  }

  function handleMultiChoiceContinue() {
    const updated: AnswersMap = { ...answers, [currentKey]: selected };
    setAnswers(updated);

    const next = question.next;
    if (next) {
      setHistory((h) => [...h, currentKey]);
      setCurrentKey(next);
    } else {
      submitAppointment(updated);
    }
  }

  function handleDateTime(value: string) {
    const updated: AnswersMap = { ...answers, [currentKey]: value };
    setAnswers(updated);

    const next = question.next;
    if (next) {
      setHistory((h) => [...h, currentKey]);
      setCurrentKey(next);
    } else {
      submitAppointment(updated);
    }
  }

  function handleNoteSubmit() {
    const updated: AnswersMap = { ...answers, note: noteText };
    setAnswers(updated);
    submitAppointment(updated);
  }

  function goBack() {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCurrentKey(prev);
      setSelected(
        Array.isArray(answers[prev]) ? (answers[prev] as string[]) : []
      );
    } else {
      router.push('/');
    }
  }

  async function submitAppointment(finalAnswers: AnswersMap) {
    setSubmitting(true);
    setError(null);

    // Only send fields relevant to the chosen activity branch, so switching
    // activity on edit doesn't leave stale fields from a previous activity.
    const activity = finalAnswers.activity as string;
    const payload: Record<string, unknown> = {
      activity,
      schedule: finalAnswers.schedule,
      note: finalAnswers.note ?? '',
    };

    if (activity === 'eat') payload.eatChoice = finalAnswers.eatChoice;
    if (activity === 'outside') payload.outsideChoice = finalAnswers.outsideChoice;
    if (activity === 'movie') {
      payload.movieLocation = finalAnswers.movieLocation;
      payload.movieGenre = finalAnswers.movieGenre;
    }

    try {
      const url =
        mode === 'edit' ? `/api/appointments/${appointmentId}` : '/api/appointments';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          schedule: new Date(payload.schedule as string).toISOString(),
        }),
      });

      if (res.status === 409) {
        setError('There is already a date scheduled at that time.');
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to save appointment');
      }

      if (mode === 'create') {
        setAnswers({});
        setSelected([]);
        setNoteText('');
        setHistory([]);
        setCurrentKey('activity');
      }

      onSaved?.();
      router.push('/viewCalendar');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wizard}>
      <button type="button" onClick={goBack} className={styles.backButton}>
        Back
      </button>

      <h2 className={styles.dateQuestion}>{question.text}</h2>

      {question.type === 'choice' && (
        <div className={styles.subOptions}>
          {question.answers!.map((a) => (
            <button
              key={a.value}
              type="button"
              className={styles.optionButton}
              onClick={() => handleChoice(a.value)}
              disabled={submitting}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi-choice' && (
        <>
          <div className={styles.subOptions}>
            {question.answers!.map((a) => (
              <button
                key={a.value}
                type="button"
                className={`${styles.optionButton} ${
                  selected.includes(a.value) ? styles.selected : ''
                }`}
                onClick={() => toggleSelection(a.value)}
                disabled={submitting}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleMultiChoiceContinue}
            disabled={selected.length === 0 || submitting}
          >
            Continue
          </button>
        </>
      )}

      {question.type === 'datetime' && (
        <DateTimeStep
          onSubmit={handleDateTime}
          submitting={submitting}
          initialValue={
            typeof answers.schedule === 'string' ? answers.schedule : undefined
          }
        />
      )}

      {question.type === 'text' && (
        <div className={styles.dateTimeForm}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Any cool notes you wanna share?"
            rows={4}
          />
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleNoteSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : question.optional && !noteText ? 'Skip & Save' : 'Save'}
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

function DateTimeStep({
  onSubmit,
  submitting,
  initialValue,
}: {
  onSubmit: (value: string) => void;
  submitting: boolean;
  initialValue?: string;
}) {
  const [initialDate, initialTime] = initialValue ? initialValue.split('T') : ['', ''];
  const [date, setDate] = useState(initialDate || '');
  const [time, setTime] = useState(initialTime?.slice(0, 5) || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit(`${date}T${time}`);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.dateTimeForm}>
      <label>
        Day
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <label>
        Hour
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Scheduling…' : 'Continue'}
      </button>
    </form>
  );
}