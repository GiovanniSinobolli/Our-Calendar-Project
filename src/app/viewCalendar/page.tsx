'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Link from 'next/link';
import styles from './viewCalendar.module.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

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

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
};

export default function ViewCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetch('/api/appointments')
      .then((res) => res.json())
      .then((data: Appointment[]) => {
        const mapped = data.map((appt) => {
          const start = new Date(appt.schedule);
          const end = new Date(start.getTime() + 60 * 60 * 1000);

          return {
            title: `${appt.activity} — ${getSubLabel(appt)}`,
            start,
            end,
            resource: appt,
          };
        });
        setEvents(mapped);
      });
  }, []);

  const handleNavigate = useCallback(
    (newDate: Date, _view: View, _action: NavigateAction) => {
      setDate(newDate);
    },
    []
  );

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  function closeCard() {
    setSelectedEvent(null);
  }

  return (
    <div style={{ height: '80vh', padding: '1rem' }}>
      <Link href="/" className={styles.backButton}>
        ← Home
      </Link>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        date={date}
        view={view}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        onSelectEvent={handleSelectEvent}
      />

      {selectedEvent && (
        <div className={styles.overlay} onClick={closeCard}>
          <div
            className={styles.detailCard}
            onClick={(e) => e.stopPropagation()} // don't close when clicking the card itself
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeCard}
              aria-label="Close"
            >
              ×
            </button>

            <h3 className={styles.cardActivity}>
              {selectedEvent.resource.activity} — {getSubLabel(selectedEvent.resource)}
            </h3>

            <p className={styles.cardDate}>
              {selectedEvent.start.toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>

            {selectedEvent.resource.note && (
              <p className={styles.cardNote}>Note: {selectedEvent.resource.note}</p>
            )}

            <Link
              href="/editPlans"
              className={styles.editLink}
            >
              Edit this date
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}