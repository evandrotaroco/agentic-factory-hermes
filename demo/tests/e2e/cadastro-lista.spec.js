import { expect, test } from '@playwright/test';

const storageKey = 'demo.personal-tasks';
const emptyText = 'Nenhuma tarefa cadastrada.';

async function register(page, title) {
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
}

test('a lista vazia oferece cadastro direto, sem conta', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('textbox', { name: 'Título', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cadastrar', exact: true })).toBeEnabled();
  await expect(page.getByText(emptyText, { exact: true })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('cadastros homônimos aparecem sem navegação como pendentes distintas e sobrevivem à recarga', async ({ page }) => {
  await page.goto('/');
  const navigations = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });

  const items = page.getByRole('listitem');
  await register(page, 'Pagar conta');
  await expect(items).toHaveCount(1);
  await expect(items.first().getByText('Pagar conta', { exact: true })).toBeVisible();
  await expect(items.first().getByText('Pendente', { exact: true })).toBeVisible();
  await expect(page.getByText(emptyText, { exact: true })).toBeHidden();

  await register(page, 'Pagar conta');
  await expect(items).toHaveCount(2);
  await expect(items.last().getByText('Pagar conta', { exact: true })).toBeVisible();
  await expect(items.last().getByText('Pendente', { exact: true })).toBeVisible();
  expect(navigations).toEqual([]);

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(saved.version).toBe(1);
  expect(saved.tasks.map(({ title, status }) => ({ title, status }))).toEqual([
    { title: 'Pagar conta', status: 'pending' },
    { title: 'Pagar conta', status: 'pending' },
  ]);
  expect(saved.tasks[0].id).not.toBe(saved.tasks[1].id);

  await page.reload();
  await expect(items).toHaveCount(2);
  await expect(items.getByText('Pagar conta', { exact: true })).toHaveCount(2);
  await expect(items.getByText('Pendente', { exact: true })).toHaveCount(2);
});

test('a abertura respeita a ordem, o estado textual e o título literal salvos', async ({ page }) => {
  const literal = '<strong>Revisar</strong>';
  await page.addInitScript(({ key, title }) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, tasks: [
      { id: '00000000-0000-4000-8000-000000000001', title, status: 'completed' },
      { id: '00000000-0000-4000-8000-000000000002', title: 'Ler', status: 'pending' },
    ] }));
  }, { key: storageKey, title: literal });

  await page.goto('/');

  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(2);
  await expect(items.first().getByText(literal, { exact: true })).toBeVisible();
  await expect(items.first().getByText('Concluída', { exact: true })).toBeVisible();
  await expect(items.last().getByText('Ler', { exact: true })).toBeVisible();
  await expect(items.last().getByText('Pendente', { exact: true })).toBeVisible();
  await expect(page.getByText(emptyText, { exact: true })).toBeHidden();
});

test('dados inválidos não mostram um falso vazio nem permitem cadastro', async ({ page }) => {
  const invalidData = '{';
  await page.addInitScript(({ key, data }) => localStorage.setItem(key, data), {
    key: storageKey, data: invalidData,
  });

  await page.goto('/');

  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar as tarefas.' })).toBeVisible();
  await expect(page.getByText(emptyText, { exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Cadastrar', exact: true })).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(invalidData);
});

test('falha de escrita mantém a última lista confirmada', async ({ page }) => {
  const saved = JSON.stringify({ version: 1, tasks: [
    { id: '00000000-0000-4000-8000-000000000001', title: 'Já salva', status: 'pending' },
  ] });
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, data);
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) throw new DOMException('Quota', 'QuotaExceededError');
      return setItem.call(this, name, value);
    };
  }, { key: storageKey, data: saved });

  await page.goto('/');
  await register(page, 'Não salva');

  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível salvar a alteração.' })).toBeVisible();
  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(1);
  await expect(items.first().getByText('Já salva', { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(saved);
});
