# Contrato da interface web — Gerenciar tarefas pessoais

Interface pública: página estática `GET /`, em português, sem autenticação, navegação adicional ou API de dados. O transporte HTTP é usado apenas para entregar arquivos estáticos; nenhuma tarefa é enviada por rede.

| Operação | Entrada e controle | Resultado observável | Rastreabilidade |
|---|---|---|---|
| Abrir/listar | Acessar `/`, sem autenticação | Mostrar formulário e lista de tarefas retidas com título e estado textual (`Pendente` / `Concluída`); se vazia, exibir `Nenhuma tarefa cadastrada.` | FR-001, FR-003; US1; SC-001 |
| Cadastrar | Campo com rótulo `Título`, botão `Cadastrar` | Título válido cria uma entrada distinta, pendente, sem recarregar. Duplicatas são aceitas. Título vazio ou somente branco exibe `O título é obrigatório.` junto ao campo, sem afetar lista ou persistência. | FR-002–FR-004; US1; SC-001–SC-003 |
| Concluir | Botão `Concluir` da entrada pendente selecionada | Só a entrada selecionada muda para `Concluída`; continua na lista, sem ação de concluir novamente e sem recarregar. | FR-003, FR-005; US2; SC-001, SC-003 |
| Excluir | Botão `Excluir` da entrada selecionada, em qualquer estado | Só a entrada selecionada some, sem recarregar. Excluir a última mostra o estado vazio. | FR-003, FR-006; US3; SC-001, SC-003 |
| Recarregar | Recarregar na mesma origem e contexto do navegador | Restaurar títulos e estados das tarefas retidas, sem restaurar excluídas. | FR-007; US3; SC-004 |

- Usar `ul`/`li` ou marcação com papéis equivalentes e botões acessíveis dentro de cada item. Os testes escopam a ação ao item escolhido, de modo que títulos repetidos não sejam seletores únicos. O vínculo interno da ação é pelo `id` do [modelo](../data-model.md), sem exigir exposição do ID ao usuário.
- Associar o erro de título ao campo e anunciá-lo; a rejeição vazia e somente branco usa a mesma validação da aplicação. Renderizar títulos como texto, não HTML. Não depender só de cor para distinguir status.
- Em falha de leitura/decodificação, informar que não foi possível carregar as tarefas e impedir mutações sem limpar a chave persistida. Em falha de gravação, informar que não foi possível salvar a alteração e manter a lista anterior.
- Não fazem parte da interface: editar, reabrir, sincronizar, recuperar dados limpos ou acessar tarefas de outro perfil/origem.
