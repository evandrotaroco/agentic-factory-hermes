import { expect, test } from '@playwright/test';

const storageKey = 'demo.personal-tasks';
const fixture = { version: 1, tasks: [
  { id: '00000000-0000-4000-8000-000000000001', title: 'Pagar conta', status: 'pending' },
  { id: '00000000-0000-4000-8000-000000000002', title: 'Pagar conta', status: 'completed' },
] };
const exclude = (item) => item.getByRole('button', { name: 'Excluir', exact: true });

async function openWithFixture(page) {
  await page.addInitScript(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
    const setItem = Storage.prototype.setItem;
    window.itemsBeforeTaskWrites = [];
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key) {
        window.itemsBeforeTaskWrites.push(document.querySelectorAll('#task-list > li').length);
      }
      return setItem.call(this, name, value);
    };
  }, { key: storageKey, data: fixture });
  await page.goto('/');
}

function snapshot(page) {
  return page.evaluate((key) => ({
    saved: JSON.parse(localStorage.getItem(key)), itemsBeforeWrites: window.itemsBeforeTaskWrites,
  }), storageKey);
}

test('exclui só a homônima escolhida e volta ao vazio sem recarga (US3)', async ({ page }) => {
  await openWithFixture(page);
  const navigations = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });

  const items = page.getByRole('listitem');
  await expect(items.getByText('Pagar conta', { exact: true })).toHaveCount(2);
  const completed = items.filter({ has: page.getByText('Concluída', { exact: true }) });
  const action = exclude(completed);
  await expect(action).toBeEnabled();
  const removedButton = await action.elementHandle();
  await action.click();

  await expect(items).toHaveCount(1);
  await expect(items.getByText('Pagar conta', { exact: true })).toBeVisible();
  await expect(items.getByText('Pendente', { exact: true })).toBeVisible();
  const afterFirst = { saved: { version: 1, tasks: [fixture.tasks[0]] }, itemsBeforeWrites: [2] };
  expect(await snapshot(page)).toEqual(afterFirst);

  // Repete a ação anterior para exercitar o ID já removido.
  await removedButton.evaluate((button) => button.click());
  expect(await snapshot(page)).toEqual(afterFirst);

  await exclude(items).click();
  await expect(items).toHaveCount(0);
  await expect(page.getByText('Nenhuma tarefa cadastrada.', { exact: true })).toBeVisible();
  expect(await snapshot(page)).toEqual({ saved: { version: 1, tasks: [] }, itemsBeforeWrites: [2, 1] });
  expect(navigations).toEqual([]);
});
