import { expect, test } from '@playwright/test';

test('recarga preserva títulos e estados sem restaurar a excluída (SC-004)', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Título', { exact: true });
  const register = page.getByRole('button', { name: 'Cadastrar', exact: true });
  const items = page.getByRole('listitem');
  const task = (title) => items.filter({ has: page.getByText(title, { exact: true }) });

  for (const title of ['Ler', 'Pagar', 'Revisar']) {
    await input.fill(title);
    await register.click();
    await expect(task(title).getByText('Pendente', { exact: true })).toBeVisible();
  }

  await task('Pagar').getByRole('button', { name: 'Concluir', exact: true }).click();
  await expect(task('Pagar').getByText('Concluída', { exact: true })).toBeVisible();
  const exclude = task('Revisar').getByRole('button', { name: 'Excluir', exact: true });
  await expect(exclude).toBeEnabled();
  await exclude.click();
  await expect(task('Revisar')).toHaveCount(0);

  await page.reload();

  await expect(items).toHaveCount(2);
  await expect(task('Ler').getByText('Pendente', { exact: true })).toBeVisible();
  await expect(task('Pagar').getByText('Concluída', { exact: true })).toBeVisible();
  await expect(task('Revisar')).toHaveCount(0);
});
