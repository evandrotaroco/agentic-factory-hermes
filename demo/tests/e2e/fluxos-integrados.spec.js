import { expect, test } from '@playwright/test';

const title = 'Pagar conta';

async function openList(page) {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  const navigations = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });

  const empty = page.getByText('Nenhuma tarefa cadastrada.', { exact: true });
  const items = page.getByRole('listitem');
  await expect(empty).toBeVisible();
  await expect(items).toHaveCount(0);
  return { empty, items, navigations };
}

async function register(page) {
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
}

const action = (item, name) => item.getByRole('button', { name, exact: true });

async function expectTask(item, status) {
  await expect(item.getByText(title, { exact: true })).toBeVisible();
  await expect(item.getByText(status, { exact: true })).toBeVisible();
}

test('cadastra, lista, conclui e exclui sem conta nem recarga (SC-001)', async ({ page }) => {
  const { empty, items, navigations } = await openList(page);

  await register(page);
  await expect(items).toHaveCount(1);
  await expectTask(items, 'Pendente');
  await expect(empty).toBeHidden();

  await action(items, 'Concluir').click();
  await expect(items).toHaveCount(1);
  await expectTask(items, 'Concluída');
  await expect(action(items, 'Concluir')).toHaveCount(0);

  await action(items, 'Excluir').click();
  await expect(items).toHaveCount(0);
  await expect(empty).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cadastrar', exact: true })).toBeEnabled();
  expect(navigations).toEqual([]);
});

test('conclui a primeira homônima e exclui apenas a segunda (SC-003)', async ({ page }) => {
  const { items, navigations } = await openList(page);

  await register(page);
  await expect(items).toHaveCount(1);
  await expectTask(items, 'Pendente');
  await register(page);
  await expect(items).toHaveCount(2);
  const first = items.first();
  const second = items.last();
  await expectTask(first, 'Pendente');
  await expectTask(second, 'Pendente');

  await action(first, 'Concluir').click();
  await expect(items).toHaveCount(2);
  await expectTask(first, 'Concluída');
  await expectTask(second, 'Pendente');
  await expect(action(first, 'Concluir')).toHaveCount(0);
  await expect(action(second, 'Concluir')).toBeEnabled();

  await action(second, 'Excluir').click();
  await expect(items).toHaveCount(1);
  await expectTask(items, 'Concluída');
  expect(navigations).toEqual([]);
});
