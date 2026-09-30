export type Answer = {
  label: string;
  value: string;
};

export type Question = {
  key: string;
  text: string;
  type: 'choice' | 'multi-choice' | 'datetime' | 'text';
  answers?: Answer[];
  next?: string;
  optional?: boolean;
};

export const questions: Record<string, Question> = {
  activity: {
    key: 'activity',
    text: 'What would we do?',
    type: 'choice',
    answers: [
      { label: 'Eat', value: 'eat' },
      { label: 'Go outside', value: 'outside' },
      { label: 'Watch a Movie', value: 'movie' },
    ],
  },
  eatChoice: {
    key: 'eatChoice',
    text: 'What do you wanna eat?',
    type: 'choice',
    answers: [
      { label: 'Italian', value: 'italian' },
      { label: 'Japanese', value: 'japanese' },
      { label: 'Burgers', value: 'burgers' },
      { label: 'Pizza', value: 'pizza' },
      { label: 'Wings', value: 'wings' },
    ],
    next: 'schedule',
  },
  outsideChoice: {
    key: 'outsideChoice',
    text: 'Where do you wanna go?',
    type: 'multi-choice',
    answers: [
      { label: 'Beach', value: 'beach' },
      { label: 'For a walk', value: 'walk' },
      { label: 'Gym', value: 'gym' },
      { label: 'Run', value: 'run' },
      { label: 'Picnic', value: 'picnic' },
      { label: 'Other', value: 'other' },
    ],
    next: 'schedule',
  },
  movieLocation: {
    key: 'movieLocation',
    text: 'Where?',
    type: 'choice',
    answers: [
      { label: 'At home', value: 'home' },
      { label: 'At the cinema', value: 'cinema' },
    ],
    next: 'movieGenre',
  },
  movieGenre: {
    key: 'movieGenre',
    text: 'What kind of movie?',
    type: 'choice',
    answers: [
      { label: 'Comedy', value: 'comedy' },
      { label: 'Action', value: 'action' },
      { label: 'Horror', value: 'horror' },
      { label: 'Romance', value: 'romance' },
      { label: 'Drama', value: 'drama' },
      { label: 'Sci-Fi', value: 'scifi' },
    ],
    next: 'schedule',
  },
  schedule: {
    key: 'schedule',
    text: 'When?',
    type: 'datetime',
    next: 'note',
  },
  note: {
    key: 'note',
    text: 'Anything you want to note about this change? (optional)',
    type: 'text',
    optional: true,
  },
};

// Maps the top-level "activity" answer to the key of the next question,
// since that question's routing depends on which activity was picked
// rather than a single fixed `next`.
export const activityRouting: Record<string, string> = {
  eat: 'eatChoice',
  outside: 'outsideChoice',
  movie: 'movieLocation',
};