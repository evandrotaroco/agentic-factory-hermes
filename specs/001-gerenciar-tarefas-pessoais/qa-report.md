# E6 — QA: Gerenciar tarefas pessoais

**Parecer: aprovado com ressalvas.** Os quatro critérios de sucesso passaram. Nenhum teste falhou e nenhum defeito alto ou crítico foi identificado na rodada. As ressalvas são a perda de foco após operações por teclado e a divergência documentada abaixo no comando do servidor de teste.

## Baseline e método

- Branch `001-gerenciar-tarefas-pessoais`, HEAD `dfcb061d656731756cdf998dfd9124fd19b496da`, com os testes novos de QA no checkout. `git diff --exit-code HEAD -- demo` retornou `0`: nenhum arquivo rastreado da demo foi alterado. Foram preservadas as alterações locais preexistentes fora da demo.
- O aceite usa Chromium e a página real em `http://127.0.0.1:4173/`, com o servidor iniciado pelo Playwright. Cada teste usa um contexto de navegador isolado. Nos testes independentes de US2 e US3, os registros sintéticos v1 são preparados antes da abertura da página. O fluxo de SC-004 cadastra e altera todas as tarefas pela interface, e recarrega na mesma origem e no mesmo contexto. Sem serviços externos ou dados reais.

## Plano executado e rastreabilidade

| Cenário de aceite | Cobertura | Evidência observada |
| --- | --- | --- |
| Fluxo sem conta | US1–US3; SC-001; FR-001, FR-002, FR-003, FR-005, FR-006 | Vazio inicial → um cadastro pendente → a mesma entrada concluída → vazio final. Nenhuma navegação do quadro principal após abrir a página. |
| Título obrigatório | US1; SC-002; FR-004 | Com uma tarefa existente, tanto o vazio quanto três espaços produziram a mensagem `O título é obrigatório.`, associada ao campo. Lista e valor armazenado não mudaram. A página foi recarregada entre tentativas para que a segunda não herdasse o erro da primeira. |
| Conclusão independente por teclado | US2; FR-003, FR-005; complementa SC-003 | Com duas homônimas pendentes na fixture, Enter concluiu somente a segunda. Ambas continuaram visíveis, sem recarga, e a concluída perdeu apenas a ação `Concluir`. |
| Exclusão independente por teclado | US3; FR-003, FR-006; complementa SC-003 | Com uma homônima pendente e outra concluída, Enter em `Excluir` removeu a concluída e preservou a pendente. Excluir a remanescente restaurou o estado vazio sem recarga. |
| Cadastro e manipulação de duplicatas | US1–US3; SC-003; FR-002, FR-003, FR-005, FR-006 | Dois cadastros de `Pagar conta` produziram duas pendentes; concluir a primeira e excluir a segunda deixou exatamente a primeira, concluída. Sem recarga. |
| Persistência após recarga | US3; SC-004; FR-007 | Após cadastrar `Ler`, `Pagar` e `Revisar`, concluir `Pagar` e excluir `Revisar`, a recarga trouxe exatamente `Ler` pendente e `Pagar` concluída. |

## Execução

`npm --prefix demo test`, executado uma vez na raiz, **saída `0`**. Ambiente: Node v24.16.0, npm 11.15.0, Python 3.14.9 e Chromium conforme a configuração do projeto.

| Grupo | Executados | Aprovados | Reprovados |
| --- | ---: | ---: | ---: |
| Node — unitários do Desenvolvedor | 44 | 44 | 0 |
| Chromium — regressão do Desenvolvedor | 18 | 18 | 0 |
| Chromium — aceite independente de QA | 6 | 6 | 0 |
| **Total** | **68** | **68** | **0** |

A saída identificou pelo nome todos os seis testes de `tests/acceptance/tarefas-pessoais.spec.js` (entradas `ok` 6, 12, 19, 22, 23 e 24) e encerrou o Playwright com `24 passed`. A cobertura acima é de critérios e cenários; o plano não exige limiar numérico de cobertura de código nem comandos separados de lint ou build.

## Achados não bloqueantes

### Médio — Perda de foco depois de concluir ou excluir por teclado

- **Área afetada:** usabilidade por teclado nos fluxos de FR-005 e FR-006. Os resultados funcionais desses requisitos e de SC-001/SC-003 passaram. A especificação não define destino de foco após as ações.
- **Reprodução:** em Chromium, abra a lista com duas tarefas homônimas. No cenário US2, foque `Concluir` na segunda pendente e pressione Enter. Em outro contexto, com uma pendente e uma concluída, foque `Excluir` na concluída e pressione Enter. Em ambos, ainda há tarefas após a ação.
- **Esperado para continuidade de navegação:** manter o foco em um controle útil da lista; não se exige um destino específico para o aceite. **Obtido:** `document.activeElement` passa de `BUTTON` para `BODY`; quem usa teclado precisa reencontrar os controles com Tab. A ação selecionada funciona.
- **Evidência:** a execução registrou `[QA foco] Concluir: BUTTON -> BODY` e `[QA foco] Excluir: BUTTON -> BODY`; os testes confirmam foco antes do Enter e registram o destino observado, sem transformar uma preferência de UX em asserção de aceite.

### Baixo — O servidor de teste ajusta a fila, mas o plano descreve o comando direto

- **Área afetada:** reprodutibilidade do ambiente de verificação; sem FR/SC impactado na execução. O ajuste não muda o comportamento público da aplicação.
- **Como identificar:** compare `plan.md:21` e o comando manual de `quickstart.md` com `demo/playwright.config.js:9–14`. **Esperado para reprodução:** a documentação distingue o servidor manual da configuração exata usada na suíte. **Obtido:** a suíte inicia o mesmo `http.server` via `python3 -c` e `runpy`, com `socketserver.TCPServer.request_queue_size = 128`, mantendo loopback, porta `4173`, raiz `public` (relativa a `demo/`) e `reuseExistingServer: false`. O comando manual não faz esse ajuste.
- **Evidência e impacto:** inspeção da configuração e execução bem-sucedida com seis workers, respostas HTTP locais e 24 testes Chromium aprovados. O comando manual continua apropriado para a checagem manual, mas não reproduz a configuração de fila da suíte ao investigar intermitência. A rodada não mediu a capacidade efetiva da fila nem demonstra a causa de falhas anteriores. Registrar a diferença no PR.

## Arquivo para revisão restrita dos testes de QA

- `demo/tests/acceptance/tarefas-pessoais.spec.js` — seis testes novos. Nenhum teste do Desenvolvedor ou arquivo do produto foi alterado.
