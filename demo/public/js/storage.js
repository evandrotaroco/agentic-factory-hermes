import { isTask } from './tasks.js';

const storageKey = 'demo.personal-tasks';
const version = 1;

function validatedTasks(tasks) {
  if (!Array.isArray(tasks)) throw new TypeError('Lista de tarefas inválida.');

  const ids = new Set();
  const records = [];
  for (const task of tasks) {
    if (!isTask(task)) throw new TypeError('Registro de tarefa inválido.');

    const { id, title, status } = task;
    const identity = id.toLowerCase();
    if (ids.has(identity)) throw new TypeError('ID de tarefa repetido.');
    ids.add(identity);
    records.push({ id, title, status });
  }
  return records;
}

export function loadTasks(storage) {
  const raw = storage.getItem(storageKey);
  if (raw === null) return [];

  const document = JSON.parse(raw);
  if (document?.version !== version) throw new TypeError('Documento de tarefas não é v1.');
  return validatedTasks(document.tasks);
}

export function saveTasks(storage, tasks) {
  const records = validatedTasks(tasks);
  storage.setItem(storageKey, JSON.stringify({ version, tasks: records }));
  return records;
}