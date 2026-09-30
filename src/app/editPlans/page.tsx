'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppointmentWizard from '../newDate/AppointmentWizard';
import styles from './editPlans.module.css';

type Appointment = {
  _id: string;
  activity: 'eat' | 'outside' | 'movie';
  eatChoice?: string;
  outsideChoice?: string[];
  movieLocation?: string;
  movieGenre?: string;
  schedule: string;
  note?: string;
};

function getSubLabel(appt: Appointment): string {
  switch (appt.activity) {
    case 'eat':
      return appt.eatChoice ?? '';
    case 'outside':
      return appt.outsideChoice?.join(', ') ?? '';
    case 'movie':
      return `${appt.movieLocation ?? ''} — ${appt.movieGenre ?? ''}`;
    default:
      return '';
  }
}

export default function EditPlansPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadAppointments() {
    fetch('/api/appointments')
      .then((res) => res.json())
      .then((data: Appointment[]) => setAppointments(data));
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    setAppointments((prev) => prev.filter((a) => a._id !== id));
    setDeletingId(null);
  }

  function buildInitialAnswers(appt: Appointment) {
    return {
      activity: appt.activity,
      ...(appt.eatChoice ? { eatChoice: appt.eatChoice } : {}),
      ...(appt.outsideChoice ? { outsideChoice: appt.outsideChoice } : {}),
      ...(appt.movieLocation ? { movieLocation: appt.movieLocation } : {}),
      ...(appt.movieGenre ? { movieGenre: appt.movieGenre } : {}),
      schedule: appt.schedule,
      ...(appt.note ? { note: appt.note } : {}),
    };
  }

  const editingAppointment = appointments.find((a) => a._id === editingId);

  if (editingAppointment) {
    return (
      <div className={styles.editWrapper}>
        <AppointmentWizard
          mode="edit"
          appointmentId={editingAppointment._id}
          initialAnswers={buildInitialAnswers(editingAppointment)}
          onSaved={() => {
            setEditingId(null);
            loadAppointments();
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.listWrapper}>
      <Link href="/" className={styles.backButton}>
        Home
      </Link>

      <h1 className={styles.title}>Your Plans</h1>

      {appointments.length === 0 && <p>No plans scheduled yet.</p>}

      <ul className={styles.list}>
        {appointments.map((appt) => (
          <li key={appt._id} className={styles.card}>
            <div className={styles.cardInfo}>
              <span className={styles.cardActivity}>
                {appt.activity} — {getSubLabel(appt)}
              </span>
              <span className={styles.cardDate}>
                {new Date(appt.schedule).toLocaleString()}
              </span>
              {appt.note && <span className={styles.cardNote}>Note: {appt.note}</span>}
            </div>
            <div className={styles.cardActions}>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditingId(appt._id)}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => handleDelete(appt._id)}
                disabled={deletingId === appt._id}
              >
                {deletingId === appt._id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}