import { expect, test } from '@playwright/test';

const storageKey = 'demo.personal-tasks';

for (const [description, title] of [['vazio', ''], ['só de espaços', '   ']]) {
  test(`título ${description} anuncia o erro sem mudar a lista ou tocar na persistência`, async ({ page }) => {
    await page.addInitScript((key) => {
      const setItem = Storage.prototype.setItem;
      window.taskWrites = 0;
      Storage.prototype.setItem = function (name, value) {
        if (this === localStorage && name === key) window.taskWrites += 1;
        return setItem.call(this, name, value);
      };
    }, storageKey);
    await page.goto('/');
    const field = page.getByRole('textbox', { name: 'Título', exact: true });
    const submit = page.getByRole('button', { name: 'Cadastrar', exact: true });
    const items = page.getByRole('listitem');

    await field.fill('Tarefa existente');
    await submit.click();
    await expect(items).toHaveCount(1);
    const before = await page.evaluate((key) => ({
      data: localStorage.getItem(key), writes: window.taskWrites,
    }), storageKey);
    expect(before.writes).toBe(1);

    await field.fill(title);
    await submit.click();

    await expect(page.getByRole('alert').filter({ hasText: 'O título é obrigatório.' })).toBeVisible();
    await expect(field).toHaveAccessibleDescription('O título é obrigatório.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(items).toHaveCount(1);
    await expect(items.first().getByText('Tarefa existente', { exact: true })).toBeVisible();
    await expect(items.first().getByText('Pendente', { exact: true })).toBeVisible();
    expect(await page.evaluate((key) => ({
      data: localStorage.getItem(key), writes: window.taskWrites,
    }), storageKey)).toEqual(before);
  });
}
