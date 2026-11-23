# E5 — Revisão de código: Gerenciar tarefas pessoais

**Parecer: aprovado com ressalvas.** Nenhum achado crítico nem violação não justificada da constituição. Esta revisão não substitui o aceite independente de E6.

**Escopo:** branch `001-gerenciar-tarefas-pessoais`, `git diff main...HEAD`, base `7733293202fbba0f548c67e3fc9afa971d50e943` e HEAD `dfcb061d656731756cdf998dfd9124fd19b496da`. Revisados produto e testes em `demo/`, à luz da constituição, da spec aprovada, do plano, do modelo, do contrato, do quickstart, da pesquisa e das tarefas. Alterações locais preexistentes fora do diff não integram o parecer.

## Achados

### Médio — O foco do teclado se perde ao concluir ou excluir

- **Local:** `demo/public/js/app.js:61–68`, `:82–99`; lacuna de teste em `demo/tests/e2e/fluxos-integrados.spec.js:39–46`.
- **Problema e impacto:** depois da gravação bem-sucedida, `renderTasks()` substitui todos os itens, inclusive o botão em foco. No Chromium, ao ativar `Concluir` ou `Excluir` com Enter, o foco sai do botão e volta para `BODY` mesmo com tarefas restantes. A ação e a persistência funcionam, mas quem navega por teclado perde a referência e precisa reencontrar os controles na ordem de tabulação. A regressão atual verifica o resultado por cliques, não o destino do foco.
- **Correção sugerida:** após concluir, devolver o foco à ação disponível da mesma tarefa; após excluir, focar uma ação da tarefa seguinte ou, se não houver, da anterior. Com a lista vazia, focar `Título`. Não deslocar o foco na falha de gravação. Cobrir os destinos com acionamento por teclado e `toBeFocused()`.

### Baixo — O comando automatizado do servidor diverge do plano

- **Local:** `demo/playwright.config.js:10–14`, `plan.md:21`, `tasks.md:24` (T004).
- **Problema e impacto:** a suíte usa `python3 -c` com `runpy` para ajustar a fila antes de iniciar o mesmo `http.server`; plano e T004 ainda descrevem a chamada literal `python3 -m http.server`. Reproduzir a suíte com a chamada do plano não reproduz o ajuste de fila e pode dificultar o diagnóstico da intermitência.
- **Correção sugerida:** registrar na descrição do PR a diferença entre o servidor de teste e o comando manual, com motivo, parâmetros preservados e evidência pós-ajuste. Não substituir o servidor nem atualizar a spec para esse ajuste de teste.
- **Avaliação constitucional:** no Python local 3.14.9, a configuração herdada por `ThreadingHTTPServer` é `5` por padrão e `128` após o ajuste, feito apenas no processo do servidor de testes. A configuração mantém o Python, `http.server`, `127.0.0.1:4173`, raiz `public`, `reuseExistingServer: false`, Chromium e a descoberta das duas suítes; não reduz a cobertura nem adiciona dependência. O histórico em `state.json:273–285` registra intermitência anterior de conexão; os resultados pós-ajuste sustentam manter o ajuste, sem provar a causa exclusiva das falhas anteriores. Sem violação constitucional identificada.

## Aderência, robustez e testes

| Requisitos | Comportamento e evidência revisados |
| --- | --- |
| FR-001–FR-003; SC-001 e SC-003 | Página única sem autenticação; estados textuais, vazio inicial/final, cadastro pendente, duplicatas distintas por UUID e atualização sem recarga. `cadastro-lista.spec.js` e `fluxos-integrados.spec.js`. |
| FR-004; SC-002 | `trim()` rejeita vazio ou branco sem alterar lista nem Storage; conserva títulos válidos como informados. Mensagem anunciável associada ao campo. `cadastro.test.js` e `titulo-obrigatorio.spec.js`. |
| FR-005–FR-006; SC-001 e SC-003 | Transições imutáveis por ID; só a tarefa escolhida muda, conclusão repetida e ID ausente não gravam. `concluir.test.js`, `excluir.test.js`, `concluir.spec.js`, `excluir.spec.js` e `fluxos-integrados.spec.js`. |
| FR-007; SC-004 | JSON v1 validado e gravação antes da publicação na UI; leitura inválida bloqueia mutações sem sobrescrita, falha de gravação mantém a lista anterior, recarga não restaura exclusões. `storage.test.js`, `app-state.test.js`, `persistencia.spec.js` e `limites-interface.spec.js`. |

- **Segurança defensiva:** títulos são renderizados com `textContent`; dados do navegador são validados em leitura e escrita, incluindo UUIDs e unicidade. Não há API de tarefas, envio de dados por rede, logs com títulos, banco ou migração. A inspeção do diff e a varredura de padrões em linhas adicionadas em `demo/` não encontraram credenciais; `.env` é ignorado na raiz e em `demo/`. A dependência direta de desenvolvimento está fixada com lock; nenhuma é necessária em execução.
- **Manutenção e desempenho:** domínio, adaptador de persistência e UI têm responsabilidades separadas. Validar, gravar e renderizar a lista inteira a cada mudança é proporcional à demo de lista pessoal, embora a substituição integral exija tratamento de foco. Coordenação entre abas não foi prometida no plano; gravações em abas diferentes podem sobrescrever mudanças e continuam sendo limitação de escopo.
- **Qualidade dos testes:** fixtures sintéticas e contextos isolados; os testes independentes de conclusão e exclusão não dependem de cadastros de outros testes. As verificações comparam lista visível e persistência real nas transições e falhas relevantes, além dos dublês unitários. Não há aceite independente executado nesta etapa.

## Evidências de execução

**Orquestrador, não reexecutadas pelo Revisor:** `npm --prefix demo test` três vezes no HEAD após o ajuste da fila, saídas `0, 0, 0`; em cada execução, 44 testes Node e 18 Chromium passaram (handoff e `state.json:245–256`). Sem comandos dedicados de lint ou build no plano.

**Revisor:**
- `git diff --check main...HEAD` → `0`, sem saída. `git check-ignore -v -- .env demo/.env` → `0`, ambos cobertos. `git ls-files -- ':(glob)**/.env*'` → `0`, sem entradas. Varredura estática do diff de `demo/` com `python3 -c` → `0`, sem candidatos por atribuições ou assinaturas verificadas.
- `python3 -c` com importação de `http.server` e `socketserver`, leitura de `ThreadingHTTPServer.request_queue_size` antes e depois da atribuição → `0`: `5` e `128` no Python 3.14.9. A sonda verificou o valor da classe, não a capacidade efetiva da fila no SO.
- `node --input-type=module -e` com Playwright Chromium, servindo os arquivos reais da UI via roteamento em memória e acionando as duas operações com Enter → `0`: `BUTTON Concluir -> BODY`, `BUTTON Excluir -> BODY`, um item remanescente. O código `0` confirma a reprodução do achado, não um aceite de acessibilidade. A sonda não usou o servidor da suíte.

## E6 — Revisão restrita dos testes de aceite do QA

**Parecer E6: aprovado com ressalvas.** Nenhum achado crítico ou violação não justificada da Constituição. O parecer de E5 permanece inalterado.

- **Escopo:** somente `demo/tests/acceptance/tarefas-pessoais.spec.js`, não rastreado, na branch `001-gerenciar-tarefas-pessoais`, HEAD `dfcb061d656731756cdf998dfd9124fd19b496da`; SHA-256 `d2018a7633b6305999cdb7216aec3fdda72e91ca51aa72c4bed6beaf310cadae` conferido antes da revisão.
- **Cobertura e isolamento:** SC-001 verifica o fluxo sem conta e sem recarga; SC-002 exige um erro novo em cada submissão inválida e compara lista e armazenamento; SC-003 exercita cadastro e manipulação de homônimas, com a ressalva abaixo; SC-004 usa alterações pela interface e verifica títulos, estados e ausência da excluída após recarregar no mesmo contexto. US2 e US3 usam fixtures sintéticas em contextos separados, sem depender de outros testes. Não foram identificados dados reais, segredos ou destinos externos no arquivo.
- **Médio — Identidade das homônimas não comprovada.** `demo/tests/acceptance/tarefas-pessoais.spec.js:95–108`, `:112–124`, `:128–143`. As asserções distinguem as entradas apenas por posição ou estado. Se os estados ficarem nas posições esperadas, uma troca indevida de IDs pode passar despercebida; na exclusão, remover a entrada errada e deixar a outra com o estado esperado também passa. Assim, há risco de falso positivo na exigência de que só a entrada escolhida seja afetada (FR-005, FR-006, SC-003). **Correção sugerida:** manter as asserções de UI e comparar IDs e estados antes/depois no armazenamento já usado pelas fixtures, confirmando que só o ID escolhido muda na conclusão ou desaparece na exclusão e que o outro fica intacto.
- **Baixo — Fixture depende de uma origem literal.** `demo/tests/acceptance/tarefas-pessoais.spec.js:34–40`. Se a origem configurada mudar, US2 e US3 deixam de receber a fixture e falham como se faltassem tarefas, sem indicar o erro de preparação. Não afeta a execução documentada em `127.0.0.1:4173`. **Correção sugerida:** derivar a origem do `baseURL` do Playwright e mantê-la como condição de escrita da fixture.
- **Execução:** `node --check demo/tests/acceptance/tarefas-pessoais.spec.js` → `0` (somente sintaxe). Evidência do QA, não reexecutada pelo Revisor: `npm --prefix demo test` → `0` (44 Node, 18 Chromium regressão e 6 Chromium aceite).
