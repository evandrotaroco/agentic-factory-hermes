import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppState } from '../../public/js/app.js';

const key = 'demo.personal-tasks';
const oldTask = { id: '01234567-89ab-4def-8123-456789abcdef', title: 'Ler', status: 'pending' };
const nextTask = { id: '01234567-89ab-4def-8123-456789abcdee', title: 'Pagar', status: 'completed' };
const saved = JSON.stringify({ version: 1, tasks: [oldTask] });

test('disponibiliza a lista persistida na inicialização, antes de qualquer gravação', () => {
  const app = createAppState({ localStorage: { getItem: () => saved } });
  assert.deepEqual(app.tasks, [oldTask]);
});

test('expõe uma lista vazia válida quando a chave está ausente', () => {
  const app = createAppState({ localStorage: { getItem: () => null } });
  assert.deepEqual(app.tasks, []);
});

test('trata acesso negado pelo getter de localStorage como falha de leitura', () => {
  const app = createAppState({ get localStorage() { throw new Error('acesso negado'); } });
  assert.deepEqual(app.save([nextTask]), { ok: false, error: 'load' });
  assert.equal(app.tasks, null);
});

for (const [failure, getItem] of [
  ['leitura', () => { throw new Error('acesso negado'); }],
  ['decodificação', () => '{'],
]) {
  test(`bloqueia gravações após falha de ${failure}`, () => {
    let writes = 0;
    const app = createAppState({ localStorage: { getItem, setItem() { writes += 1; } } });
    assert.deepEqual(app.save([nextTask]), { ok: false, error: 'load' });
    assert.equal(writes, 0);
    assert.equal(app.tasks, null);
  });
}

test('publica nova lista somente após a escrita síncrona terminar', () => {
  const candidate = [{ ...nextTask }];
  let duringWrite;
  let persisted;
  const app = createAppState({ localStorage: {
    getItem: () => saved,
    setItem(name, value) {
      assert.equal(name, key);
      duringWrite = app.tasks;
      persisted = JSON.parse(value);
    },
  } });

  assert.deepEqual(app.save(candidate), { ok: true });
  assert.deepEqual(duringWrite, [oldTask]);
  assert.deepEqual(persisted, { version: 1, tasks: [nextTask] });
  assert.deepEqual(app.tasks, [nextTask]);
});

test('falha de escrita mantém a última lista confirmada e permite nova tentativa', () => {
  let stored = saved;
  let unavailable = true;
  const app = createAppState({ localStorage: {
    getItem: () => stored,
    setItem(name, value) {
      if (unavailable) throw new Error('cota excedida');
      stored = value;
    },
  } });

  const confirmed = app.tasks;
  assert.deepEqual(app.save([nextTask]), { ok: false, error: 'save' });
  assert.equal(app.tasks, confirmed);
  assert.equal(stored, saved);

  unavailable = false;
  assert.deepEqual(app.save([nextTask]), { ok: true });
  assert.deepEqual(app.tasks, [nextTask]);
});

test('protege a lista confirmada de alterações fora da operação de salvar', () => {
  const app = createAppState({ localStorage: { getItem: () => saved, setItem() {} } });
  const candidate = [{ ...nextTask }];
  assert.deepEqual(app.save(candidate), { ok: true });

  candidate[0].title = 'Alteração não salva';
  assert.throws(() => { app.tasks[0].title = 'Outra alteração não salva'; }, TypeError);
  assert.throws(() => app.tasks.pop(), TypeError);
  assert.deepEqual(app.tasks, [nextTask]);
});