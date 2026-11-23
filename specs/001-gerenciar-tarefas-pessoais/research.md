# Pesquisa técnica — Gerenciar tarefas pessoais

## 1. Aplicação web estática (FR-001–FR-006; US1–US3)

- **Decisão:** HTML, CSS e módulos JavaScript nativos; uma página, sem dependências de execução, backend ou autenticação. Separar regras de tarefa, armazenamento e interface. Usar controles HTML com nomes acessíveis e estados textuais. Renderizar título como texto, nunca como markup.
- **Justificativa:** uma tela e quatro operações locais não justificam roteador, estado global externo ou etapa de empacotamento. A separação permite testar as regras e o adaptador sem iniciar um navegador.
- **Alternativas avaliadas:** framework com bundler adicionaria dependências e build para uma tela; API com banco adicionaria processos e persistência fora do contexto local.

## 2. Persistência e falhas (FR-002–FR-007; US1–US3)

- **Decisão:** usar `localStorage` com uma chave dedicada e um documento JSON versionado, carregado na abertura e salvo a cada alteração bem-sucedida. Validar o documento antes de usá-lo; publicar a alteração na interface só após salvar. Em falha de leitura/validação, preservar o valor armazenado e bloquear mutações. Em falha de escrita, mostrar erro e manter a última lista confirmada. Gerar IDs com `crypto.randomUUID()` e endereçar ações somente por ID.
- **Justificativa:** `localStorage` é associado à origem e atende ao recarregamento, mas pode ser negado por política do navegador e não oferece bloqueio para alterações concorrentes.[1] A API `randomUUID()` gera UUID v4 em contexto seguro; a demo usa `127.0.0.1`, reconhecido como origem potencialmente confiável.[8][9] A separação entre ID e título suporta duplicatas. Não há dados legados nem migração inicial; a versão do envelope evita interpretar silenciosamente um formato incompatível.
- **Alternativas avaliadas:** `sessionStorage` limita os dados à sessão da janela; IndexedDB, embora útil para volumes maiores ou consultas, exigiria abertura assíncrona de banco e gerenciamento de esquema; serializar por título impediria duplicatas. Gravações simultâneas em abas diferentes podem sobrescrever mudanças: não há sincronização nem garantia de concorrência entre abas nesta entrega.

## 3. Verificação reproduzível sem infraestrutura externa (SC-001–SC-004)

- **Decisão:** Node.js 24/npm 11 para os testes, `node:test` para domínio e armazenamento com dublês, `@playwright/test` como única dependência npm direta de desenvolvimento e Chromium gerenciado por ele. Servir apenas `demo/public/` com `http.server` de Python 3.14 ligado a `127.0.0.1`, exclusivamente para demo local e testes.
- **Justificativa:** o executor nativo do Node aceita um glob de testes entre aspas, dispensando uma segunda biblioteca de testes.[2]
  - O Playwright pode iniciar um servidor local para a suíte.[3]
  - Cada teste recebe um contexto que isola o armazenamento.[4]
  - A instalação do Chromium acompanha a versão do Playwright.[7]
  - A CLI do Python permite limitar a interface de escuta e a raiz publicada.[5]
  - O comando `npm ci` exige um lock e não altera o manifesto nem o lock.[6]
- **Alternativas avaliadas:** testes só em Node não verificariam o DOM nem recarregamento real; testes só manuais não dariam regressão automática; um servidor npm dedicado adicionaria uma dependência quando Python já está disponível no checkout.
- **Risco de preparação:** E4 deve fixar a versão exata compatível de Playwright no manifesto e gerar o lock. A instalação inicial do pacote e do Chromium precisa de rede e permissão no ambiente de desenvolvimento; a aplicação e os testes, já instalados, não acessam serviços externos. A porta `4173` deve estar livre na validação automatizada, que não reutiliza servidor preexistente.

## Sources

[1] https://html.spec.whatwg.org/multipage/webstorage.html — WHATWG — HTML Standard: Web storage
[2] https://nodejs.org/docs/latest-v24.x/api/test.html — Node.js 24 — Test runner
[3] https://playwright.dev/docs/test-webserver — Playwright — Web server
[4] https://playwright.dev/docs/browser-contexts — Playwright — Isolation
[5] https://docs.python.org/3.14/library/http.server.html — Python 3.14 — http.server
[6] https://docs.npmjs.com/cli/v11/commands/npm-ci — npm 11 — npm ci
[7] https://playwright.dev/docs/browsers — Playwright — Browsers
[8] https://w3c.github.io/webcrypto — W3C — Web Cryptography API Level 2
[9] https://w3c.github.io/webappsec-secure-contexts — W3C — Secure Contexts
