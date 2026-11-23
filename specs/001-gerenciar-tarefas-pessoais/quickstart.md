# Quickstart — Gerenciar tarefas pessoais

## Preparação após a implementação

Na raiz do checkout da feature, use Node.js 24, npm 11 e Python 3.14 disponível como `python3`. A preparação precisa do lock gerado em E4 e de acesso ao registro npm e ao download do Chromium, ou de ambientes/caches previamente provisionados. Não use dados ou credenciais reais.

```sh
npm --prefix demo ci --include=dev
npm --prefix demo run browser:install
npm --prefix demo test
```

A suíte executa primeiro os unitários do Desenvolvedor e depois os cenários Chromium presentes em `demo/tests/e2e/` e `demo/tests/acceptance/`. Esperado: saída `0` e nenhum teste obrigatório falhando. O Playwright inicia e encerra o servidor local; a porta `4173` deve estar livre. O navegador de teste usa contexto isolado por cenário e não precisa de servidor de produção.

## Validação manual da interface

Depois dos testes automatizados, da raiz do checkout:

```sh
python3 -m http.server --bind 127.0.0.1 --directory demo/public 4173
```

Abra `http://127.0.0.1:4173/` no navegador. Comece cada cenário em novo contexto descartável (para validação manual, use um perfil de teste limpo ou feche todas as janelas privadas antes de reabrir). Dentro do último cenário, não mude a origem nem o contexto. Consulte o [contrato da interface](contracts/web-ui.md) e o [modelo](data-model.md).

| Cenário | Passos | Resultados esperados |
|---|---|---|
| Fluxo completo (SC-001; FR-001, FR-002, FR-003, FR-005, FR-006; US1–US3) | Abra `/`, cadastre `Pagar conta`, clique em `Concluir` e depois `Excluir` nessa entrada. | Sem autenticação: vazio inicial, uma pendente, a mesma concluída, lista vazia novamente. Não recarregue durante o fluxo. |
| Título obrigatório (SC-002; FR-004; US1) | Cadastre `Tarefa existente`; envie o formulário com o título vazio; repita com três espaços. | `O título é obrigatório.` nos dois envios. A lista continua com a mesma entrada e nenhuma tarefa inválida. |
| Duplicatas sem confundir identidades (SC-003; FR-002, FR-003, FR-005, FR-006; US1–US3) | Cadastre `Pagar conta` duas vezes, conclua a primeira e exclua a segunda (que ficou pendente). | Veja duas pendentes antes de concluir, depois exatamente uma pendente e uma concluída; ao final, reste `Pagar conta`, concluída. Sem recarregar. |
| Excluir a duplicata concluída (US3, aceite 1–2; FR-003, FR-006) | Em cenário independente, prepare duas entradas `Pagar conta`, uma pendente e outra concluída; exclua a concluída e depois exclua a pendente restante. | Só a pendente deve restar após a primeira exclusão, e após a segunda a interface deve indicar lista vazia. |
| Persistência no mesmo contexto (SC-004; FR-007; US3) | Cadastre `Ler`, `Pagar` e `Revisar`. Conclua `Pagar`, exclua `Revisar` e recarregue a página. | Exatamente `Ler` pendente e `Pagar` concluída, com os títulos preservados; `Revisar` continua ausente. |

Em automação, os testes independentes de US2 e US3 devem preparar registros sintéticos conforme o modelo antes de abrir a página, sem depender da execução de US1 ou de outro teste. Use as ações da interface para preparar e verificar o fluxo completo de SC-004. Registre comando, código de saída e cenários cobertos; encerre o servidor manual com `Ctrl+C` ao terminar.
