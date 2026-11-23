import { expect, test } from '@playwright/test';

const storageKey = 'demo.personal-tasks';
const fixture = { version: 1, tasks: [
  { id: '00000000-0000-4000-8000-000000000001', title: 'Pagar conta', status: 'pending' },
  { id: '00000000-0000-4000-8000-000000000002', title: 'Pagar conta', status: 'pending' },
] };
const conclude = (item) => item.getByRole('button', { name: 'Concluir', exact: true });

async function openWithFixture(page, failWrites = false) {
  await page.addInitScript(({ key, data, failWrites }) => {
    localStorage.setItem(key, JSON.stringify(data));
    const setItem = Storage.prototype.setItem;
    window.taskWrites = 0;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) {
        window.taskWrites += 1;
        if (failWrites) throw new DOMException('Quota', 'QuotaExceededError');
      }
      return setItem.call(this, name, value);
    };
  }, { key: storageKey, data: fixture, failWrites });
  await page.goto('/');
}

function snapshot(page) {
  return page.evaluate((key) => ({
    saved: JSON.parse(localStorage.getItem(key)), writes: window.taskWrites,
  }), storageKey);
}

test('apenas a homônima escolhida é concluída sem recarga', async ({ page }) => {
  await openWithFixture(page);
  const navigations = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });
  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(2);
  await expect(items.getByText('Pendente', { exact: true })).toHaveCount(2);
  const selected = items.nth(1);
  const action = conclude(selected);
  await expect(action).toBeEnabled();
  const originalButton = await action.elementHandle();
  await action.click();

  await expect(items).toHaveCount(2);
  await expect(items.getByText('Pagar conta', { exact: true })).toHaveCount(2);
  await expect(selected.getByText('Concluída', { exact: true })).toBeVisible();
  await expect(conclude(selected)).toHaveCount(0);
  await expect(items.first().getByText('Pendente', { exact: true })).toBeVisible();
  await expect(conclude(items.first())).toBeEnabled();
  const after = await snapshot(page);
  expect(after).toEqual({ writes: 1, saved: { version: 1, tasks: [
    fixture.tasks[0], { ...fixture.tasks[1], status: 'completed' },
  ] } });

  // Reenvia a ação anterior sem depender de um controle agora ausente na interface.
  await originalButton.evaluate((button) => button.click());
  expect(await snapshot(page)).toEqual(after);
  expect(navigations).toEqual([]);
});

test('falha ao salvar a conclusão mantém a tarefa pendente', async ({ page }) => {
  await openWithFixture(page, true);
  const items = page.getByRole('listitem');
  const selected = items.nth(1);
  await expect(conclude(selected)).toBeEnabled();
  await conclude(selected).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível salvar a alteração.' })).toBeVisible();
  await expect(items.getByText('Pendente', { exact: true })).toHaveCount(2);
  await expect(conclude(selected)).toBeEnabled();
  expect(await snapshot(page)).toEqual({ saved: fixture, writes: 1 });
});
