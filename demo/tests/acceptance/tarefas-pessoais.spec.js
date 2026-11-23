import { expect, test } from '@playwright/test';

const duplicateTitle = 'Pagar conta';
const storageKey = 'demo.personal-tasks';
const titleField = (page) => page.getByRole('textbox', { name: 'Título', exact: true });
const tasks = (page) => page.getByRole('list', { name: 'Tarefas cadastradas' }).getByRole('listitem');
const text = (container, label) => container.getByText(label, { exact: true });
const action = (container, name) => container.getByRole('button', { name, exact: true });
const taskByTitle = (page, title) => tasks(page).filter({ has: text(page, title) });
const taskByStatus = (page, status) => tasks(page).filter({ has: text(page, status) });

async function addTask(page, title) {
  await titleField(page).fill(title);
  await action(page, 'Cadastrar').click();
}

async function expectTask(item, title, status) {
  await expect(text(item, title)).toBeVisible();
  await expect(text(item, status)).toBeVisible();
}

async function expectEmpty(page) {
  await expect(text(page, 'Nenhuma tarefa cadastrada.')).toBeVisible();
  await expect(tasks(page)).toHaveCount(0);
}

async function openWithoutReload(page, statuses) {
  if (statuses) {
    const tasks = statuses.map((status, index) => ({
      id: `d0e00000-0000-4000-8000-00000000000${index + 1}`,
      title: duplicateTitle,
      status,
    }));
    await page.addInitScript(({ key, tasks }) => {
      if (window === window.top && location.origin === 'http://127.0.0.1:4173') {
        localStorage.setItem(key, JSON.stringify({ version: 1, tasks }));
      }
    }, { key: storageKey, tasks });
  }
  await page.goto('/');
  const mainNavigations = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) mainNavigations.push(frame.url());
  });
  return () => expect(mainNavigations, 'O fluxo não deve navegar nem recarregar').toEqual([]);
}

// Observação da E5, sem impor um destino de foco não especificado.
async function pressEnterAndObserveFocus(page, button, name) {
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  const activeTag = await page.evaluate(() => document.activeElement?.tagName);
  console.log(`[QA foco] ${name}: BUTTON -> ${activeTag}`);
}

test('SC-001 | fluxo sem conta: lista vazia, cadastro, conclusão e exclusão', async ({ page }) => {
  const expectNoReload = await openWithoutReload(page);
  await expectEmpty(page);
  await addTask(page, duplicateTitle);
  await expect(tasks(page)).toHaveCount(1);
  const item = taskByTitle(page, duplicateTitle);
  await expectTask(item, duplicateTitle, 'Pendente');
  await action(item, 'Concluir').click();
  await expectTask(item, duplicateTitle, 'Concluída');
  await action(item, 'Excluir').click();
  await expectEmpty(page);
  expectNoReload();
});

test('US1 / SC-002 | vazio e três espaços são rejeitados sem alterar o cadastro', async ({ page }) => {
  await page.goto('/');
  await expectEmpty(page);
  await addTask(page, 'Tarefa existente');
  await expectTask(tasks(page), 'Tarefa existente', 'Pendente');
  const stored = () => page.evaluate((key) => localStorage.getItem(key), storageKey);
  const before = await stored();
  const message = page.getByRole('alert').filter({ hasText: 'O título é obrigatório.' });

  for (const [label, value] of [['vazio', ''], ['somente espaços', '   ']]) {
    await test.step(label, async () => {
      // A segunda submissão precisa produzir seu próprio erro, não herdar o anterior.
      await expect(message).toHaveCount(0);
      await addTask(page, value);
      await expect(message).toBeVisible();
      await expect(titleField(page)).toHaveAccessibleDescription('O título é obrigatório.');
      await expect(tasks(page)).toHaveCount(1);
      await expectTask(tasks(page), 'Tarefa existente', 'Pendente');
      expect(await stored()).toBe(before);
      if (value === '') await page.reload();
    });
  }
});

test('US2 | Enter conclui apenas a homônima pendente escolhida', async ({ page }) => {
  const expectNoReload = await openWithoutReload(page, ['pending', 'pending']);
  await expect(tasks(page)).toHaveCount(2);
  const first = tasks(page).first();
  const second = tasks(page).nth(1);
  await expectTask(first, duplicateTitle, 'Pendente');
  await expectTask(second, duplicateTitle, 'Pendente');

  await pressEnterAndObserveFocus(page, action(second, 'Concluir'), 'Concluir');

  await expect(tasks(page)).toHaveCount(2);
  await expectTask(first, duplicateTitle, 'Pendente');
  await expectTask(second, duplicateTitle, 'Concluída');
  await expect(action(second, 'Concluir')).toHaveCount(0);
  expectNoReload();
});

test('US3 | Enter exclui a homônima concluída; excluir a última volta ao vazio', async ({ page }) => {
  const expectNoReload = await openWithoutReload(page, ['pending', 'completed']);
  await expect(tasks(page)).toHaveCount(2);
  await expectTask(taskByStatus(page, 'Pendente'), duplicateTitle, 'Pendente');
  const completed = taskByStatus(page, 'Concluída');
  await expectTask(completed, duplicateTitle, 'Concluída');

  await pressEnterAndObserveFocus(page, action(completed, 'Excluir'), 'Excluir');

  await expect(tasks(page)).toHaveCount(1);
  await expectTask(tasks(page), duplicateTitle, 'Pendente');
  await action(tasks(page), 'Excluir').click();
  await expectEmpty(page);
  expectNoReload();
});

test('SC-003 | dois cadastros homônimos: concluir um e excluir o outro', async ({ page }) => {
  const expectNoReload = await openWithoutReload(page);
  await addTask(page, duplicateTitle);
  await addTask(page, duplicateTitle);
  await expect(tasks(page)).toHaveCount(2);
  await expectTask(tasks(page).first(), duplicateTitle, 'Pendente');
  await expectTask(tasks(page).nth(1), duplicateTitle, 'Pendente');

  await action(tasks(page).first(), 'Concluir').click();
  await expect(tasks(page)).toHaveCount(2);
  await expectTask(tasks(page).first(), duplicateTitle, 'Concluída');
  await expectTask(tasks(page).nth(1), duplicateTitle, 'Pendente');
  await action(taskByStatus(page, 'Pendente'), 'Excluir').click();
  await expect(tasks(page)).toHaveCount(1);
  await expectTask(tasks(page), duplicateTitle, 'Concluída');
  expectNoReload();
});

test('SC-004 | recarregar preserva exatamente as tarefas retidas e seus estados', async ({ page }) => {
  await page.goto('/');
  await expectEmpty(page);
  for (const title of ['Ler', 'Pagar', 'Revisar']) await addTask(page, title);
  await expect(tasks(page)).toHaveCount(3);
  for (const title of ['Ler', 'Pagar', 'Revisar']) {
    await expectTask(taskByTitle(page, title), title, 'Pendente');
  }
  await action(taskByTitle(page, 'Pagar'), 'Concluir').click();
  await expectTask(taskByTitle(page, 'Pagar'), 'Pagar', 'Concluída');
  await action(taskByTitle(page, 'Revisar'), 'Excluir').click();
  await expect(tasks(page)).toHaveCount(2);
  await expect(taskByTitle(page, 'Revisar')).toHaveCount(0);

  await page.reload();

  await expect(tasks(page)).toHaveCount(2);
  await expectTask(taskByTitle(page, 'Ler'), 'Ler', 'Pendente');
  await expectTask(taskByTitle(page, 'Pagar'), 'Pagar', 'Concluída');
  await expect(taskByTitle(page, 'Revisar')).toHaveCount(0);
});
