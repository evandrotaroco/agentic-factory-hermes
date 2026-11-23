---
description: "Tarefas de implementação da feature Gerenciar tarefas pessoais"
---

# Tasks: Gerenciar tarefas pessoais

**Entrada**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/web-ui.md](contracts/web-ui.md), [quickstart.md](quickstart.md) e [constituição](../../.specify/memory/constitution.md).

**Testes**: O Desenvolvedor escreve unitários em `demo/tests/unit/` e regressões Chromium em `demo/tests/e2e/`. Os unitários de domínio acompanham a tarefa que implementa o comportamento. Os testes de contrato verificam resultados pela interface, não a estrutura interna. O QA escreve e executa o aceite independente em E6, sob `demo/tests/acceptance/`; o Desenvolvedor não escreve nem altera esses testes.

## Formato e caminhos

`- [ ] T001 [P] [US1] descrição com caminho`: IDs em ordem; `[P]` indica autoria paralela em arquivos distintos e sem dependência pendente entre as tarefas do grupo; `[USn]` aparece somente nas fases de história. Os caminhos `demo/...` são relativos à raiz do checkout. A saída de código, configuração e testes do produto fica toda em `demo/`.

**Gate de cada fase E4**: antes de dar a fase por concluída, executar `npm --prefix demo test` da raiz e registrar comando, código e cenários; exigir saída `0`, com pelo menos um teste Node e um Chromium real desde Setup. Não ignorar testes obrigatórios nem aceitar suíte vazia. Escrever as regressões de história antes da implementação correspondente e observar a falha esperada; o gate verde é no fim da fase. Não há comandos dedicados de lint ou build neste plano.

## Fase 1: Setup (infraestrutura compartilhada)

**Objetivo**: disponibilizar página mínima e suíte executável, sem antecipar as operações de usuário.

- [X] T001 [P] Criar `demo/.gitignore` para `node_modules/`, `test-results/` e `playwright-report/`.
- [X] T002 [P] Criar `demo/public/index.html` como página HTML mínima em português com título e cabeçalho estáveis para o smoke, sem introduzir fluxo de tarefa nesta fase.
- [X] T003 Configurar `demo/package.json` privado com `type: module`, `test` igual a `node --test "tests/unit/*.test.js" && playwright test` e `browser:install` igual a `playwright install chromium`; fixar a versão exata compatível de `@playwright/test` como única dependência direta de desenvolvimento, gerar `demo/package-lock.json` e instalar as dependências e o Chromium correspondente conforme o quickstart (Node.js 24, npm 11, Python 3.14; após T001).
- [X] T004 [P] Configurar `demo/playwright.config.js` para descobrir `*.spec.js` em `demo/tests/e2e/` e `demo/tests/acceptance/`, executar Chromium com contexto isolado por teste e iniciar de `demo/` o comando `python3 -m http.server --bind 127.0.0.1 --directory public 4173`, com URL/base `http://127.0.0.1:4173/` e sem reutilizar servidor existente (após T003).
- [X] T005 [P] Criar em `demo/tests/unit/setup.test.js` um teste `node:test` que verifica o manifesto privado, ESM e scripts do plano (após T003).
- [X] T006 Criar em `demo/tests/e2e/smoke.spec.js` um smoke Chromium que navega a `/` pelo servidor real e verifica sucesso HTTP e o cabeçalho visível (após T002 e T004).

**Checkpoint**: o comando comum executa o teste Node de configuração e o smoke Chromium real.

## Fase 2: Foundational (pré-requisitos bloqueantes)

**Objetivo**: preparar as regras compartilhadas, o adaptador v1 e o carregamento inicial antes das histórias.

- [X] T007 [P] Criar em `demo/public/js/tasks.js` a validação pura de registros e os estados estáveis, aplicando as definições de [data-model.md, Tarefa](data-model.md#entidade-tarefa) para `Tarefa.id`, `Tarefa.title` e `Tarefa.status`, sem DOM ou Storage; testar o domínio em `demo/tests/unit/task-model.test.js` (FR-002, FR-004, FR-007).
- [X] T008 [P] Especificar com dublê de `Storage` a leitura/gravação v1 em `demo/tests/unit/storage.test.js`: chave ausente, round-trip com títulos duplicados e ambos os estados, JSON inválido, versão incompatível, campos inválidos, IDs repetidos, falhas de leitura/escrita e preservação de outras chaves, conforme [data-model.md](data-model.md) (FR-007).
- [X] T009 Implementar leitura e gravação injetáveis em `demo/public/js/storage.js`; usar a chave dedicada e validar `version` e `tasks` conforme [data-model.md, Esquema de persistência v1](data-model.md#esquema-de-persistência-v1-fr-007), reutilizando a validação de `Tarefa.id`, `Tarefa.title` e `Tarefa.status` do mesmo modelo e validando a unicidade de IDs na lista. Distinguir chave ausente de dados inválidos, não converter nem sobrescrever dados rejeitados e salvar somente na chave dedicada (FR-007; após T007 e T008).
- [X] T010 Preparar o carregamento e a operação de salvar antes de publicar em `demo/public/js/app.js`: obter `window.localStorage` dentro do tratamento de erro, carregar antes da futura primeira renderização, bloquear mutações após falha de leitura e manter a última lista confirmada em falha de escrita. Testar essas regras de coordenação com dublês em `demo/tests/unit/app-state.test.js`; a apresentação dos erros entra em US1 (FR-003, FR-007; após T009).

**Checkpoint**: a infraestrutura e os unitários de armazenamento funcionam; os testes de Setup continuam verdes.

## Fase 3: User Story 1 — Cadastrar e listar tarefas (P1) 🎯 MVP

**Objetivo**: abrir a lista sem conta, cadastrar e ver imediatamente a tarefa pendente; distinguir duplicatas e rejeitar títulos inválidos.

**Teste independente**: em contexto Chromium novo, abrir a lista vazia, cadastrar duas vezes `Pagar conta`, verificar duas pendentes sem recarga; enviar vazio e somente espaços e verificar a mesma mensagem e lista inalterada, sem concluir ou excluir nenhuma tarefa.

### Testes do Desenvolvedor

- [X] T011 [P] [US1] Criar em `demo/tests/e2e/cadastro-lista.spec.js` testes de contrato do acesso sem conta, vazio inicial, cadastro válido, título e estado visíveis sem recarga e entradas distintas de mesmo título (FR-001, FR-002, FR-003; parcelas de SC-001 e SC-003; [contrato](contracts/web-ui.md)).
- [X] T012 [P] [US1] Criar em `demo/tests/e2e/titulo-obrigatorio.spec.js` teste de contrato que envia título vazio e somente espaços com tarefa existente, verifica `O título é obrigatório.` associado ao campo nos dois casos e confirma lista e persistência inalteradas (FR-004; SC-002; [contrato](contracts/web-ui.md)).

### Implementação

- [X] T013 [P] [US1] Adicionar formulário `Título`/`Cadastrar`, região de erro anunciável, lista semântica e ponto de entrada do módulo em `demo/public/index.html`; ligar `demo/public/styles.css` para estilos da página sem depender de cor para indicar status (FR-001, FR-003, FR-004; SC-001, SC-002; [contrato](contracts/web-ui.md); após T011 e T012).
- [X] T014 [P] [US1] Implementar cadastro puro em `demo/public/js/tasks.js` segundo [data-model.md, Tarefa](data-model.md#entidade-tarefa) para `Tarefa.id`, `Tarefa.title` e `Tarefa.status`: receber o ID gerado no chamador, acrescentar a pendente sem deduplicar títulos e rejeitar o inválido sem mutar a lista; cobrir essas regras e a ordem em `demo/tests/unit/cadastro.test.js` (FR-002, FR-004; SC-001–SC-003; após T011 e T012).
- [X] T015 [US1] Integrar em `demo/public/js/app.js` o carregamento inicial à renderização da lista em ordem, com títulos literais, estados textuais e `Nenhuma tarefa cadastrada.` apenas para lista vazia válida; exibir o erro de leitura em vez de vazio enganoso e impedir mutações nessa condição (FR-001, FR-003, FR-007; SC-001, SC-004; [contrato](contracts/web-ui.md); após T013 e T014).
- [X] T016 [US1] Ligar o envio do formulário em `demo/public/js/app.js` sem navegação, gerar o ID com `crypto.randomUUID()` para `Tarefa.id` conforme [data-model.md](data-model.md), associar e anunciar o erro de título quando inválido, e publicar a lista atualizada só após salvar; sinalizar falha de escrita sem alterar a lista visível (FR-001–FR-004, FR-007; SC-001–SC-003; após T015).

**Checkpoint**: validar US1 sem ações de conclusão ou exclusão.

## Fase 4: User Story 2 — Concluir uma tarefa (P2)

**Objetivo**: marcar apenas a pendente selecionada como concluída, mantendo ambas as entradas quando houver títulos iguais.

**Teste independente**: preparar documento sintético v1 com duas pendentes homônimas e IDs distintos em contexto Chromium novo antes de abrir `/`; concluir uma pelo seu item e verificar que ambas continuam visíveis, só ela mudou de estado, não é reconcluível e não houve recarga. Não cadastrar nem excluir no cenário.

### Testes do Desenvolvedor

- [X] T017 [P] [US2] Criar em `demo/tests/e2e/concluir.spec.js` o teste de contrato independente com duas pendentes homônimas, usando botão `Concluir` escopado ao item escolhido e verificando também a ausência do botão após conclusão (FR-001, FR-003, FR-005; parcelas de SC-001 e SC-003; [contrato](contracts/web-ui.md)).
- [X] T018 [P] [US2] Criar em `demo/tests/unit/concluir.test.js` os testes de transição pura: efeito no ID selecionado, outra entrada preservada, ID ausente e conclusão repetida sem efeito (FR-005; [data-model.md](data-model.md)).

### Implementação

- [X] T019 [US2] Implementar a transição pura de conclusão em `demo/public/js/tasks.js` por `Tarefa.id`, com resultado conforme `Tarefa.status`, ambos em [data-model.md, Tarefa](data-model.md#entidade-tarefa); tratar ID ausente e repetição sem alteração (FR-005; SC-001, SC-003; após T017 e T018).
- [X] T020 [US2] Mostrar `Concluir` apenas em itens pendentes e ligar o botão ao ID em `demo/public/js/app.js`; manter o item na lista e atualizar o estado textual apenas após salvar, sem recarga nem gravação para transição sem efeito (FR-001, FR-003, FR-005; SC-001, SC-003; após T019).

**Checkpoint**: executar a regressão independente de US2 sem depender de dados de US1; manter US1 verde.

## Fase 5: User Story 3 — Excluir uma tarefa (P3)

**Objetivo**: excluir somente a tarefa selecionada em qualquer estado e preservar, após recarga, o conjunto restante com seus títulos e estados.

**Teste independente**: preparar duas entradas homônimas em estados diferentes em contexto Chromium novo; excluir a concluída e verificar que resta só a pendente, depois excluí-la e verificar o vazio, sem cadastrar ou concluir no cenário. Em outro contexto, executar pela UI o fluxo de três tarefas de SC-004 e recarregar na mesma origem e contexto.

### Testes do Desenvolvedor

- [X] T021 [P] [US3] Criar em `demo/tests/e2e/excluir.spec.js` o teste de contrato independente com fixture sintética v1: excluir a concluída de um par homônimo, manter a pendente intacta e excluir a última com indicação de vazio, sem recarga (FR-001, FR-003, FR-006; aceite US3 1–2; [contrato](contracts/web-ui.md)).
- [X] T022 [P] [US3] Criar em `demo/tests/e2e/persistencia.spec.js` o teste de contrato que cadastra três títulos distintos pela UI, conclui um e exclui outro, recarrega na mesma origem e contexto e verifica exatamente a pendente e a concluída preservadas, sem retorno da excluída (FR-007; SC-004; [quickstart](quickstart.md)).
- [X] T023 [P] [US3] Criar em `demo/tests/unit/excluir.test.js` testes de transição pura para remoção da pendente ou da concluída por ID, preservação da outra tarefa homônima e nenhuma alteração com ID ausente (FR-006; [data-model.md](data-model.md)).

### Implementação

- [X] T024 [US3] Implementar a remoção por `Tarefa.id` em `demo/public/js/tasks.js`, sem restringir a operação pelo `Tarefa.status`, segundo [data-model.md, Tarefa](data-model.md#entidade-tarefa); não alterar as demais entradas nem a ordem e tratar ID ausente sem efeito (FR-006; SC-001, SC-003; após T021–T023).
- [X] T025 [US3] Ligar `Excluir` a cada item em `demo/public/js/app.js`, salvar o documento sem a entrada removida usando o mecanismo de T009–T010 e só então atualizar a lista ou o estado vazio; não recarregar, não gravar quando não houver alteração e não guardar registro para restauração (FR-001, FR-003, FR-006, FR-007; SC-001, SC-003, SC-004; após T024).

**Checkpoint**: US3 passa isoladamente por fixture e o fluxo de recarga confirma persistência real, sem comprometer US1 e US2.

## Fase 6: Polish (preocupações transversais)

- [X] T026 [P] Consolidar em `demo/tests/e2e/fluxos-integrados.spec.js` as regressões completas de SC-001 e SC-003 do [quickstart](quickstart.md), em contextos distintos: vazio → cadastro/lista → conclusão → exclusão/vazio sem recarga; e duas homônimas → concluir uma → excluir a outra → restar só a concluída (FR-001, FR-002, FR-003, FR-005, FR-006).
- [X] T027 [P] Adicionar em `demo/tests/e2e/limites-interface.spec.js` regressões de armazenamento ilegível/inválido com bloqueio e preservação dos dados, falha de escrita mantendo a lista confirmada e título com aparência de markup exibido literalmente, sem interpretar HTML (FR-003, FR-007; [contrato](contracts/web-ui.md)).
- [X] T028 Conferir, na configuração `demo/playwright.config.js` e na interface em `demo/public/index.html`, o isolamento, a descoberta das suítes, o servidor somente em loopback e a semântica dos controles; verificar em `demo/public/js/app.js` e `demo/public/js/storage.js` que não se registram conteúdos das tarefas nos logs. Rodar a suíte e confrontar as regressões com a matriz do [quickstart](quickstart.md), registrando cobertura e código de saída sem editar o quickstart (após T026 e T027).

## Dependências e ordem de execução

- **Ordem E4**: Setup → Foundational → US1/P1 → US2/P2 → US3/P3 → Polish, com o gate comum em cada transição. US2 reaproveita lista e persistência de US1; US3 reaproveita lista e persistência, e o teste de recarga ponta a ponta também exige a ação da US2. O teste independente de cada história não depende de execução anterior nem compartilha dados com outro teste.
- **Por fase**: T001 e T002 podem começar juntas; T004 e T005 seguem T003; T006 depende do servidor configurado e da página. T007 e T008 podem começar juntas com o modelo como contrato; T009 integra ambas e T010 integra o adaptador. Nas histórias, os grupos de regressões precedem a implementação, conforme as referências nas tarefas.
- **Paralelismo após os pré-requisitos**: US1: T011 e T012 (regressões distintas), depois T013 e T014 (HTML/CSS e domínio). US2: T017 e T018 (Chromium e Node). US3: T021, T022 e T023 (exclusão na interface, recarga e domínio). Polish: T026 e T027 escrevem arquivos distintos. Não abrir fases diferentes em paralelo: elas compartilham `tasks.js` e `app.js`. `[P]` não implica execução simultânea de suítes que disputem a porta `4173`.

## Rastreabilidade

| Requisito | Implementação | Evidência automatizada do Desenvolvedor |
|---|---|---|
| FR-001 | T013, T015, T016, T020, T025 | T011, T017, T021, T026 |
| FR-002 | T014, T016 | T011, T014, T026 |
| FR-003 | T013, T015, T016, T020, T025 | T011, T017, T021, T026, T027 |
| FR-004 | T014, T016 | T012, T014 |
| FR-005 | T019, T020 | T017, T018, T026 |
| FR-006 | T024, T025 | T021, T023, T026 |
| FR-007 | T009, T010, T015, T016, T020, T025 | T008, T010, T022, T027 |

| Critério | Cobertura do Desenvolvedor |
|---|---|
| SC-001 | T026 (completo), T011 e T017 (parcelas) |
| SC-002 | T012 (completo) |
| SC-003 | T026 (completo), T011 e T017 (parcelas) |
| SC-004 | T022 (completo) |

**Aceite independente (E6, fora do checklist E4)**: após revisão do código, o QA cobre SC-001, SC-002, SC-003 e SC-004 e os cenários independentes US1–US3 de acordo com o quickstart, com dados sintéticos, contextos isolados e evidência de execução. Testes de aceite novos ou alterados em `demo/tests/acceptance/` passam por revisão independente; não substituem os unitários e regressões do Desenvolvedor.

## Estratégia de implementação

1. Concluir Setup e Foundational, depois entregar **MVP = US1/P1**: cadastro, validação e lista local sem conta. Validar o teste independente de US1 e a suíte antes de avançar; a demo é local, sem deploy.
2. Acrescentar US2/P2 e depois US3/P3, validando o cenário independente e as regressões em cada incremento. Fechar com Polish e a matriz do quickstart antes da revisão E5.
3. Na preparação de E4, prever acesso autorizado ao registro npm e ao Chromium ou caches provisionados, e porta `4173` livre. Não trocar a pilha, reaproveitar servidor alheio ou dispensar o teste real para contornar indisponibilidade.
