import { expect, test } from '@playwright/test';

const storageKey = 'demo.personal-tasks';
const titleField = (page) => page.getByRole('textbox', { name: 'Título', exact: true });
const registerButton = (page) => page.getByRole('button', { name: 'Cadastrar', exact: true });
const storedTasks = (page) => page.evaluate((key) => localStorage.getItem(key), storageKey);

async function register(page, title) {
  await titleField(page).fill(title);
  await registerButton(page).click();
}

for (const [description, raw, denyRead] of [
  ['versão incompatível', '{"version":2,"tasks":[]}', false],
  ['leitura negada', '{"version":1,"tasks":[]}', true],
]) {
  test(`${description} bloqueia alterações e preserva o valor armazenado`, async ({ page }) => {
    await page.addInitScript(({ key, raw, denyRead }) => {
      const storage = window.localStorage;
      storage.setItem(key, raw);
      if (denyRead) {
        const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
        window.restoreTaskStorage = () => Object.defineProperty(window, 'localStorage', original);
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get() { throw new DOMException('Leitura indisponível', 'SecurityError'); },
        });
      }
    }, { key: storageKey, raw, denyRead });

    await page.goto('/');

    await expect(page.getByRole('alert').getByText('Não foi possível carregar as tarefas.', { exact: true })).toBeVisible();
    await expect(page.getByText('Nenhuma tarefa cadastrada.', { exact: true })).toBeHidden();
    await expect(page.getByRole('listitem')).toHaveCount(0);
    await expect(titleField(page)).toBeDisabled();
    await expect(registerButton(page)).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Concluir', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Excluir', exact: true })).toHaveCount(0);

    if (denyRead) await page.evaluate(() => window.restoreTaskStorage());
    expect(await storedTasks(page)).toBe(raw);
  });
}

test('falha ao salvar exclusão mantém a lista confirmada', async ({ page }) => {
  await page.goto('/');
  await register(page, 'Pagar conta');
  await register(page, 'Ler');

  const items = page.getByRole('listitem');
  const first = items.first();
  const second = items.last();
  const exclude = first.getByRole('button', { name: 'Excluir', exact: true });
  await first.getByRole('button', { name: 'Concluir', exact: true }).click();
  await expect(first.getByText('Concluída', { exact: true })).toBeVisible();
  const before = await storedTasks(page);
  expect(before).not.toBeNull();

  await page.evaluate((key) => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) throw new DOMException('Cota indisponível', 'QuotaExceededError');
      return setItem.call(this, name, value);
    };
  }, storageKey);
  await exclude.click();

  await expect(page.getByRole('alert').getByText('Não foi possível salvar a alteração.', { exact: true })).toBeVisible();
  await expect(items).toHaveCount(2);
  await expect(first.getByText('Pagar conta', { exact: true })).toBeVisible();
  await expect(first.getByText('Concluída', { exact: true })).toBeVisible();
  await expect(second.getByText('Ler', { exact: true })).toBeVisible();
  await expect(second.getByText('Pendente', { exact: true })).toBeVisible();
  expect(await storedTasks(page)).toBe(before);
});

test('título com aparência de marcação permanece texto literal após cadastro e recarga', async ({ page }) => {
  const literal = '<em>Revisar</em>';
  await page.goto('/');
  await register(page, literal);

  const item = page.getByRole('listitem');
  await expect(item.getByText(literal, { exact: true })).toBeVisible();
  await expect(item.locator('em')).toHaveCount(0);

  await page.reload();

  await expect(item.getByText(literal, { exact: true })).toBeVisible();
  await expect(item.locator('em')).toHaveCount(0);
});
