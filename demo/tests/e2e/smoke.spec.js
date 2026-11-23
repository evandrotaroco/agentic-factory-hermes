import { expect, test } from '@playwright/test';

test('a página inicial é servida com o cabeçalho visível', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Tarefas pessoais', exact: true })).toBeVisible();
});
