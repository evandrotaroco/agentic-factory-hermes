import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTasks, saveTasks } from '../../public/js/storage.js';

const key = 'demo.personal-tasks';
const tasks = [
  { id: '01234567-89ab-4def-8123-456789abcdef', title: '  Pagar conta  ', status: 'pending' },
  { id: '01234567-89ab-4def-8123-456789abcdee', title: '  Pagar conta  ', status: 'completed' },
];

function memoryStorage(entries = []) {
  const data = new Map(entries);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

test('chave ausente resulta em lista vazia sem inicializar a persistência', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadTasks(storage), []);
  assert.equal(storage.getItem(key), null);
});

test('grava e restaura v1 com títulos duplicados, na ordem e em ambos os estados', () => {
  const storage = memoryStorage();
  saveTasks(storage, tasks);
  assert.deepEqual(JSON.parse(storage.getItem(key)), { version: 1, tasks });
  assert.deepEqual(loadTasks(storage), tasks);
});

test('não limpa outras chaves ao gravar uma lista vazia', () => {
  const storage = memoryStorage([['outra.chave', 'valor sintético']]);
  saveTasks(storage, []);
  assert.equal(storage.getItem('outra.chave'), 'valor sintético');
  assert.deepEqual(JSON.parse(storage.getItem(key)), { version: 1, tasks: [] });
});

for (const [label, raw] of [
  ['JSON inválido', '{'],
  ['string vazia', ''],
  ['envelope nulo', 'null'],
  ['versão incompatível', JSON.stringify({ version: 2, tasks })],
  ['versão não numérica', JSON.stringify({ version: '1', tasks })],
  ['lista ausente', '{"version":1}'],
  ['lista que não é array', '{"version":1,"tasks":{}}'],
  ['ID inválido', JSON.stringify({ version: 1, tasks: [{ ...tasks[0], id: 'sem-uuid' }] })],
  ['título inválido', JSON.stringify({ version: 1, tasks: [{ ...tasks[0], title: ' ' }] })],
  ['estado inválido', JSON.stringify({ version: 1, tasks: [{ ...tasks[0], status: 'done' }] })],
  ['IDs repetidos', JSON.stringify({ version: 1, tasks: [tasks[0], tasks[0]] })],
  ['mesmo UUID com caixa diferente', JSON.stringify({
    version: 1, tasks: [tasks[0], { ...tasks[1], id: tasks[0].id.toUpperCase() }],
  })],
]) {
  test(`rejeita ${label} sem sobrescrever o valor original`, () => {
    const storage = memoryStorage([[key, raw]]);
    assert.throws(() => loadTasks(storage));
    assert.equal(storage.getItem(key), raw);
  });
}

test('rejeita listas inválidas na gravação e mantém o documento confirmado', () => {
  const original = JSON.stringify({ version: 1, tasks });
  const storage = memoryStorage([[key, original]]);
  for (const invalid of [{}, Array(1), [{ ...tasks[0], status: 'done' }], [tasks[0], tasks[0]]]) {
    assert.throws(() => saveTasks(storage, invalid));
    assert.equal(storage.getItem(key), original);
  }
});

test('propaga a falha de acesso em getItem', () => {
  const denied = new Error('leitura indisponível');
  const storage = { getItem() { throw denied; } };
  assert.throws(() => loadTasks(storage), (error) => error === denied);
});

test('propaga a falha de acesso em setItem', () => {
  const quota = new Error('gravação indisponível');
  const storage = { setItem() { throw quota; } };
  assert.throws(() => saveTasks(storage, tasks), (error) => error === quota);
});