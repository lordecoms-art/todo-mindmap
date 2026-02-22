export const STATUS_CYCLE = ['todo', 'inprogress', 'done'];
export const STATUS_LABELS = { todo: 'À faire', inprogress: 'En cours', done: 'Fait' };
export const STATUS_COLORS = { todo: '#6B7280', inprogress: '#F59E0B', done: '#10B981' };
export const PRIORITY_LABELS = { urgent: 'Urgent', important: 'Important', normal: 'Normal' };
export const PRIORITY_COLORS = { urgent: '#FF6B6B', important: '#FFB347', normal: '#10B981' };
export const PROJECT_COLORS = ['#FF6B6B', '#4ECDC4', '#A78BFA', '#FFB347', '#FF79C6', '#50FA7B'];
export const PROJECT_EMOJIS = ['\u{1F3AF}', '\u{1F4A1}', '\u{1F527}', '\u{1F4E6}', '\u{1F31F}', '\u26A1', '\u{1F3A8}', '\u{1F52C}'];

export const INITIAL_PROJECTS = [
  {
    id: 'proj1',
    name: 'Mon Projet',
    emoji: '\u{1F680}',
    priority: 'urgent',
    color: '#FF6B6B',
    tasks: [
      { id: 't1', text: 'Première tâche', status: 'todo' },
      { id: 't2', text: 'Deuxième tâche', status: 'inprogress' },
      { id: 't3', text: 'Tâche terminée', status: 'done' },
    ],
  },
  {
    id: 'proj2',
    name: 'Idées',
    emoji: '\u{1F4A1}',
    priority: 'normal',
    color: '#4ECDC4',
    tasks: [
      { id: 't4', text: 'Explorer de nouvelles idées', status: 'todo' },
      { id: 't5', text: 'Planifier le sprint', status: 'todo' },
    ],
  },
];

let idCounter = Date.now();
export function genId() { return 'id_' + (idCounter++); }
