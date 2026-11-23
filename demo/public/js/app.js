import { loadTasks, saveTasks } from './storage.js';

function freezeTasks(tasks) {
  for (const task of tasks) Object.freeze(task);
  return Object.freeze(tasks);
}

export function createAppState(browser = globalThis.window) {
  let storage;
  let confirmed;

  try {
    storage = browser.localStorage;
    confirmed = freezeTasks(loadTasks(storage));
  } catch {
    confirmed = null;
  }

  return {
    get tasks() {
      return confirmed;
    },
    save(candidate) {
      if (confirmed === null) return { ok: false, error: 'load' };

      try {
        confirmed = freezeTasks(saveTasks(storage, candidate));
        return { ok: true };
      } catch {
        return { ok: false, error: 'save' };
      }
    },
  };
}