# Implementation Plan: Gerenciar tarefas pessoais

**Branch**: `001-gerenciar-tarefas-pessoais` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-gerenciar-tarefas-pessoais/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Uma página HTML/CSS/JavaScript para cadastrar, listar, concluir e excluir tarefas sem conta. IDs distinguem entradas de mesmo título. `localStorage` preserva tarefas e estados ao recarregar no mesmo contexto. Decisões e alternativas em [research.md](research.md).

## Technical Context

**Language/Version**: HTML, CSS e módulos ES nativos; Node.js 24/npm 11 para testes; Python 3.14 (`python3`) para servir a demo local.

**Primary Dependencies**: Nenhuma em execução. `@playwright/test` é a única dependência npm direta de desenvolvimento. Em E4, fixar a versão exata compatível, gerar o lock e instalar o Chromium correspondente. Ignorar `node_modules/`, `test-results/` e `playwright-report/` no `demo/.gitignore`.

**Storage**: `localStorage` numa chave dedicada, JSON v1 validado. Não há banco, migração inicial, segredos nem configuração sensível. Usar fixtures sintéticas e dublês conforme o [modelo](data-model.md).

**Testing**: Desenvolvedor: `node:test` em `demo/tests/unit/` e regressões Chromium em `demo/tests/e2e/`. QA: aceite independente em `demo/tests/acceptance/`. Configurar `demo/package.json` privado com `type: module`, script `test` como `node --test "tests/unit/*.test.js" && playwright test` e `browser:install` como `playwright install chromium`. Configurar Playwright para descobrir `*.spec.js` em `e2e/` e `acceptance/`, usar Chromium e contexto isolado por teste, iniciar `python3 -m http.server --bind 127.0.0.1 --directory public 4173` a partir de `demo/` e usar `http://127.0.0.1:4173/` como URL/base, sem reutilizar servidor existente. Ver [quickstart.md](quickstart.md).

| Chave em `state.json.commands` | Verificação na raiz do checkout |
|---|---|
| `test` | `npm --prefix demo test` (obrigatória: unitários e navegador; a constituição não exige limiar numérico de cobertura) |
| `lint` | `null` (sem lint dedicado neste escopo) |
| `build` | `null` (arquivos servidos diretamente, sem compilação ou typecheck dedicado) |

**Target Platform**: Chromium moderno, via HTTP em `127.0.0.1:4173` para demo e teste, não `file:`. Sem destino de produção nesta etapa.

**Project Type**: Aplicação web estática, uma página, sem backend nem empacotador.

**Performance Goals**: Refletir mudanças na página sem recarregar (FR-003); sem meta quantitativa na spec.

**Constraints**: Código e testes sob `demo/`; sem conta, API de tarefas, segredos ou sincronização. Validar entradas e dados persistidos, renderizar título como texto e servir apenas `demo/public/` em loopback.

**Scale/Scope**: Uma lista pessoal por origem e contexto do navegador (US1–US3). Sem edição, reabertura ou coordenação de escritas concorrentes entre abas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio / gate | Antes da pesquisa | Após o desenho |
|---|---|---|
| I — Especificação | Aprovação em `6809cc5`; pedido de continuar e autorização específica no handoff. | Conforme: US/FR/SC rastreados e spec intacta. |
| II — Modularidade | Uma tela e separação de responsabilidades como critérios. | Conforme: domínio puro, armazenamento e interface separados e sem dependências de execução. |
| III — Segurança | Menor privilégio, sem segredos ou conexão de produção. | Conforme: fronteiras validadas, títulos como texto e servidor restrito a loopback. |
| IV — Testes | Exigir testes proporcionais e ligados ao aceite. | Conforme no desenho: suíte obrigatória e cenários rastreáveis; execução registrada em etapas posteriores. |
| V — Revisão | Preservar E5 e E6. | Conforme no desenho: revisão independente de código e testes, inclusive testes novos ou modificados pelo QA. |
| Fluxo e governança | Escopo E2, sem implementação, publicação ou merge. | Conforme: E3 e E3.5 antes de E4; gates de publicação e merge humano preservados. |

**Resultado pós-desenho:** aprovado, sem violações ou dispensas.

## Project Structure

### Documentation (this feature)

```text
specs/001-gerenciar-tarefas-pessoais/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── web-ui.md
└── tasks.md                 # Saída de E3, não criada em E2.
```

### Source Code (repository root)
```text
demo/
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── tasks.js          # Validação e transições por ID.
│       ├── storage.js        # Leitura, validação de esquema e gravação.
│       └── app.js            # Eventos, coordenação e renderização.
└── tests/
    ├── unit/                 # Desenvolvedor.
    ├── e2e/                  # Desenvolvedor.
    └── acceptance/          # QA.
```

**Structure Decision**: `public/` separa os arquivos servidos de configuração e testes. O domínio não depende de DOM ou persistência; o adaptador recebe uma implementação de `Storage`; `app.js` liga eventos ao domínio e ao adaptador, gerando IDs com `crypto.randomUUID()`. A [interface web](contracts/web-ui.md) é o único contrato externo.

- **Setup / Foundational:** preparar manifesto, lock, configuração e página inicial. Desde Setup, incluir um teste Node de configuração e um teste Chromium real de carregamento inicial pelo servidor. Em Foundational, criar módulos compartilhados e testar o adaptador com `Storage` em memória. Adicionar testes junto aos comportamentos entregues, sem permitir execução sem testes.
- **US1:** cadastro, lista, estado vazio, título obrigatório e duplicatas (FR-001–FR-004; SC-001–SC-003).
- **US2:** conclusão apenas da pendente selecionada (FR-003, FR-005; SC-001, SC-003).
- **US3:** exclusão, volta à lista vazia e preservação ao recarregar (FR-003, FR-006, FR-007; SC-001, SC-003, SC-004).
- **Polish:** conferir a matriz do quickstart e regressões para falhas de armazenamento e renderização literal; não registrar conteúdo das tarefas nos logs.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não aplicável: sem violações identificadas.
