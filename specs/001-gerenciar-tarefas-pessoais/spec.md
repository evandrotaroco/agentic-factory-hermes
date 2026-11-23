# Feature Specification: Gerenciar tarefas pessoais

**Feature Branch**: `main` (branch efetiva da elaboração inicial; a branch da feature ainda não foi criada)

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "desenvolver uma aplicação web simples de gerenciamento de tarefas pessoais, permitindo cadastrar, listar, concluir e excluir tarefas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - US1: Cadastrar e listar tarefas (Priority: P1)

Como pessoa que organiza suas próprias atividades, quero registrar uma tarefa e vê-la na lista para saber o que ainda preciso fazer.

**Why this priority**: Registrar e consultar tarefas já permite usar a aplicação como lista pessoal, ainda que as outras ações não estejam disponíveis.

**Independent Test**: Abrir a aplicação sem tarefas, enviar um título válido e um inválido e observar a lista, sem usar conclusão nem exclusão.

**Acceptance Scenarios**:

1. **Dado** que não há tarefas, **quando** a pessoa abre a aplicação web, **então** ela pode cadastrar uma tarefa sem entrar em uma conta e a interface informa que a lista está vazia. (FR-001, FR-003)
2. **Dado** que a lista está aberta, **quando** a pessoa cadastra “Pagar conta”, **então** surge uma nova entrada com esse título e estado pendente, sem precisar recarregar a página. (FR-002, FR-003)
3. **Dado** que a lista contém uma tarefa, **quando** a pessoa tenta cadastrar um título vazio ou composto apenas de espaços em branco, **então** a interface indica que o título é obrigatório e a lista não muda. (FR-004)
4. **Dado** que já existe uma tarefa chamada “Pagar conta”, **quando** a pessoa cadastra outra com o mesmo título, **então** vê duas entradas distintas e a nova entrada está pendente. (FR-002, FR-003)

### User Story 2 - US2: Concluir uma tarefa (Priority: P2)

Como pessoa que acompanha seus afazeres, quero marcar uma tarefa como concluída para distinguir o que já fiz do que ainda falta.

**Why this priority**: Distinguir os dois estados permite acompanhar o progresso sem perder de vista o que já foi feito.

**Independent Test**: Abrir uma lista preparada com tarefas pendentes e concluir uma delas, sem cadastrar nem excluir tarefas durante o teste.

**Acceptance Scenarios**:

1. **Dado** que existem duas tarefas pendentes com o mesmo título, **quando** a pessoa conclui uma delas, **então** só a escolhida passa a exibir o estado concluído e ambas continuam listadas. (FR-003, FR-005)

### User Story 3 - US3: Excluir uma tarefa (Priority: P3)

Como pessoa que mantém uma lista de afazeres, quero excluir tarefas que não preciso mais acompanhar para manter a lista útil.

**Why this priority**: A exclusão mantém a lista atualizada, mas não é necessária para registrar atividades nem para acompanhar o progresso.

**Independent Test**: Abrir uma lista preparada com tarefas em estados diferentes e excluí-las pela interface sem cadastrar nem concluir tarefas durante o teste.

**Acceptance Scenarios**:

1. **Dado** que duas tarefas com o mesmo título estão listadas, uma pendente e uma concluída, **quando** a pessoa exclui a concluída, **então** apenas a entrada escolhida desaparece e a pendente não muda. (FR-006)
2. **Dado** que resta apenas uma tarefa pendente, **quando** a pessoa a exclui, **então** a lista volta a informar que está vazia. (FR-003, FR-006)
3. **Dado** que três tarefas com títulos distintos foram cadastradas, uma foi concluída e outra foi excluída, **quando** a pessoa recarrega a página no mesmo contexto de uso, **então** vê apenas a pendente e a concluída, com seus títulos e estados preservados. (FR-007; ver premissa de persistência local)

### Edge Cases

- Lista vazia no primeiro acesso ou após a última exclusão: mostrar o estado vazio sem impedir novo cadastro.
- Título ausente ou composto só de espaços em branco: rejeitar o cadastro sem mudar a lista.
- Títulos iguais: aceitar entradas distintas; concluir ou excluir uma delas não altera a outra.
- Recarregamento da página: preservar tarefas e estados mantidos e não restaurar exclusões no mesmo contexto de uso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A aplicação DEVE oferecer, pela interface web e sem conta ou autenticação, as ações de cadastrar, listar, concluir e excluir tarefas. (US1–US3, SC-001)
- **FR-002**: A aplicação DEVE criar uma tarefa pendente para cada cadastro com título válido, inclusive quando já existir outra tarefa com o mesmo título. (US1–US2, SC-001 e SC-003)
- **FR-003**: A lista DEVE mostrar o título e o estado de cada tarefa cadastrada e não excluída, informar quando estiver vazia e refletir as alterações sem exigir recarregamento da página. (US1–US3, SC-001 e SC-003)
- **FR-004**: A aplicação DEVE rejeitar títulos vazios ou compostos apenas por espaços em branco, informar que o título é obrigatório e manter a lista inalterada. (US1, SC-002)
- **FR-005**: A aplicação DEVE permitir marcar a tarefa pendente selecionada como concluída, mantendo-a visível e sem alterar as demais. (US2, SC-001 e SC-003)
- **FR-006**: A aplicação DEVE permitir excluir a tarefa selecionada, pendente ou concluída, sem alterar as demais. (US3, SC-001 e SC-003)
- **FR-007**: A aplicação DEVE preservar localmente, ao recarregar a página no mesmo contexto de uso, os títulos e estados das tarefas não excluídas e manter ausentes as excluídas. (US3, SC-004)

### Key Entities *(include if feature involves data)*

- **Tarefa**: Item individual da lista pessoal, com título obrigatório e estado pendente ou concluído. Títulos não precisam ser únicos; cada item é tratado separadamente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Partindo de uma lista vazia, a pessoa realiza as quatro ações na interface web, sem conta nem recarregamento manual: cadastra uma tarefa, vê a entrada pendente, conclui a entrada e depois a exclui, voltando ao estado vazio.
- **SC-002**: Em dois envios inválidos (título vazio e título composto só por espaços em branco), nenhuma tarefa é criada e a interface informa em ambos que o título é obrigatório.
- **SC-003**: Com duas tarefas de mesmo título, concluir uma e depois excluir a outra resulta em exatamente uma tarefa listada, com o título original e o estado concluído; cada ação afeta apenas a entrada escolhida.
- **SC-004**: Após cadastrar três tarefas distintas, concluir uma e excluir outra, um recarregamento no mesmo contexto apresenta exatamente as duas tarefas mantidas, com seus títulos e estados corretos, sem mostrar a excluída.

## Assumptions

- A aplicação destina-se ao uso individual, sem contas, colaboração ou sincronização entre dispositivos.
- Para que a lista continue útil após recarregar a página, assume-se persistência local no mesmo contexto de uso. Não se exige recuperação após limpeza dos dados locais. A forma de persistência fica para o plano técnico.
- O produto não depende de banco de dados externo nem de integrações complexas. Edição e reabertura de tarefas não fazem parte desta entrega.
- Restrições da entrega: manter código e testes da aplicação em `demo/`, separados da infraestrutura da fábrica, e testar os quatro fluxos e suas validações de forma proporcional, com rastreabilidade aos cenários de aceite.
