import assert from 'node:assert/strict';
import test from 'node:test';
import { isTask, TaskStatus } from '../../public/js/tasks.js';

const task = {
  id: '01234567-89ab-4def-8123-456789abcdef',
  title: '  Pagar conta  ',
  status: 'pending',
};

test('os estados estáveis correspondem ao esquema v1', () => {
  assert.deepEqual(TaskStatus, { PENDING: 'pending', COMPLETED: 'completed' });
});

test('aceita registros válidos nos dois estados sem alterar o título', () => {
  const record = Object.freeze({ ...task, status: 'completed' });
  assert.equal(isTask(record), true);
  assert.equal(isTask(task), true);
  assert.equal(record.title, '  Pagar conta  ');
});

test('rejeita registros com ID ausente ou fora do formato UUID v4', () => {
  for (const id of [undefined, 123, '', task.id + '\n',
    '01234567-89ab-5def-8123-456789abcdef', '01234567-89ab-4def-7123-456789abcdef']) {
    assert.equal(isTask({ ...task, id }), false, String(id));
  }
});

test('rejeita títulos ausentes, não textuais ou em branco', () => {
  for (const title of [undefined, null, 123, '', ' \t\n ']) {
    assert.equal(isTask({ ...task, title }), false);
  }
});

test('rejeita estado desconhecido ou registro que não seja objeto de tarefa', () => {
  for (const value of [null, [], 'pending', {}, { ...task, status: 'done' }]) {
    assert.equal(isTask(value), false);
  }
});