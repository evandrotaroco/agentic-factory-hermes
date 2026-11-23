import assert from 'node:assert/strict';
import test from 'node:test';
import * as tasks from '../../public/js/tasks.js';

const pending = Object.freeze({
  id: '00000000-0000-4000-8000-000000000001', title: 'Pagar conta', status: 'pending',
});
const completed = Object.freeze({
  ...pending, id: '00000000-0000-4000-8000-000000000002', status: 'completed',
});
const other = Object.freeze({
  ...pending, id: '00000000-0000-4000-8000-000000000003', title: 'Ler',
});
const original = Object.freeze([pending, completed, other]);

for (const [selected, retained] of [[pending, completed], [completed, pending]]) {
  test(`excluir ${selected.status} por ID preserva a homônima e a ordem`, () => {
    const result = tasks.deleteTask(original, selected.id);

    assert.deepEqual(result, [retained, other]);
    assert.equal(result[0], retained);
    assert.equal(result[1], other);
    assert.deepEqual(original, [pending, completed, other]);
  });
}

test('excluir com ID ausente mantém a mesma lista', () => {
  assert.equal(tasks.deleteTask(original, '00000000-0000-4000-8000-000000000004'), original);
});
