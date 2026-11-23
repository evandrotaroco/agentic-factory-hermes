import assert from 'node:assert/strict';
import test from 'node:test';
import * as tasks from '../../public/js/tasks.js';

const first = Object.freeze({
  id: '00000000-0000-4000-8000-000000000001', title: 'Pagar conta', status: 'pending',
});
const second = Object.freeze({ ...first, id: '00000000-0000-4000-8000-000000000002' });
const original = Object.freeze([first, second]);

test('concluir por ID altera só a pendente escolhida sem mutar a lista original', () => {
  const result = tasks.completeTask(original, second.id);

  assert.deepEqual(result, [first, { ...second, status: 'completed' }]);
  assert.equal(result[0], first);
  assert.equal(original[1].status, 'pending');
});

test('ID ausente mantém a mesma lista', () => {
  assert.equal(tasks.completeTask(original, '00000000-0000-4000-8000-000000000003'), original);
});

test('conclusão repetida mantém a mesma lista', () => {
  const completed = Object.freeze({ ...second, status: 'completed' });
  const confirmed = Object.freeze([first, completed]);

  assert.equal(tasks.completeTask(confirmed, second.id), confirmed);
});
