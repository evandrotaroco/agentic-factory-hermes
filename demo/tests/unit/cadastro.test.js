import assert from 'node:assert/strict';
import test from 'node:test';
import * as tasks from '../../public/js/tasks.js';

const firstId = '00000000-0000-4000-8000-000000000001';
const secondId = '00000000-0000-4000-8000-000000000002';

test('o cadastro acrescenta uma pendente com o ID fornecido e o título não aparado', () => {
  assert.deepEqual(tasks.registerTask([], firstId, '  Pagar conta  '), [
    { id: firstId, title: '  Pagar conta  ', status: 'pending' },
  ]);
});

test('o cadastro preserva a ordem e não deduplica títulos nem altera a lista de origem', () => {
  const existing = Object.freeze({ id: firstId, title: 'Pagar conta', status: 'completed' });
  const original = Object.freeze([existing]);

  assert.deepEqual(tasks.registerTask(original, secondId, 'Pagar conta'), [
    existing,
    { id: secondId, title: 'Pagar conta', status: 'pending' },
  ]);
  assert.deepEqual(original, [existing]);
});

for (const [description, title] of [['ausente', undefined], ['vazio', ''], ['em branco', ' \t\n ']]) {
  test(`o cadastro rejeita título ${description} sem alterar a lista`, () => {
    const existing = Object.freeze({ id: firstId, title: 'Ler', status: 'pending' });
    const original = Object.freeze([existing]);

    assert.equal(tasks.registerTask(original, secondId, title), null);
    assert.deepEqual(original, [existing]);
  });
}

test('um ID inválido não produz uma lista candidata', () => {
  assert.equal(tasks.registerTask([], 'id-inválido', 'Ler'), null);
});
