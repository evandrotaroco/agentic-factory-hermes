import { loadTasks, saveTasks } from './storage.js';
import { completeTask, deleteTask, registerTask, TaskStatus } from './tasks.js';

const statusLabels = {
  [TaskStatus.PENDING]: 'Pendente',
  [TaskStatus.COMPLETED]: 'Concluída',
};

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

function mountTaskPage(browser) {
  const { document } = browser;
  const state = createAppState(browser);
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-list');
  const storageError = document.getElementById('storage-error');

  if (state.tasks === null) {
    storageError.textContent = 'Não foi possível carregar as tarefas.';
    return;
  }

  function saveCandidate(candidate) {
    if (state.save(candidate).ok) return true;

    storageError.textContent = 'Não foi possível salvar a alteração.';
    return false;
  }

  function applyTaskChange(transition, id) {
    const current = state.tasks;
    const candidate = transition(current, id);
    if (candidate === current) return;

    storageError.textContent = '';
    if (saveCandidate(candidate)) renderTasks();
  }

  function renderTasks() {
    const items = state.tasks.map((task) => {
      const item = document.createElement('li');
      const title = document.createElement('span');
      const status = document.createElement('span');
      title.className = 'task-title';
      title.textContent = task.title;
      status.className = 'task-status';
      status.textContent = statusLabels[task.status];
      item.append(title, status);

      if (task.status === TaskStatus.PENDING) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Concluir';
        button.addEventListener('click', () => applyTaskChange(completeTask, task.id));
        item.append(button);
      }

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Excluir';
      deleteButton.addEventListener('click', () => applyTaskChange(deleteTask, task.id));
      item.append(deleteButton);

      return item;
    });

    list.replaceChildren(...items);
    list.hidden = items.length === 0;
    empty.hidden = items.length !== 0;
  }

  renderTasks();
  const form = document.getElementById('task-form');
  const titleField = document.getElementById('task-title');
  const titleError = document.getElementById('title-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    storageError.textContent = '';

    const candidate = registerTask(state.tasks, browser.crypto.randomUUID(), titleField.value);
    if (candidate === null) {
      titleField.setAttribute('aria-invalid', 'true');
      titleError.textContent = 'O título é obrigatório.';
      titleField.focus();
      return;
    }

    titleField.removeAttribute('aria-invalid');
    titleError.textContent = '';

    if (!saveCandidate(candidate)) return;

    form.reset();
    renderTasks();
  });

  document.getElementById('task-controls').disabled = false;
}

if (typeof window !== 'undefined') mountTaskPage(window);