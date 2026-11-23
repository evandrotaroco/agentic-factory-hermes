# Modelo de dados — Gerenciar tarefas pessoais

## Entidade: Tarefa

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string UUID v4 | Gerado no cadastro, único na lista, imutável e persistido. A seleção da UI usa este campo, nunca o título. |
| `title` | string | Obrigatório: `title.trim()` deve ser não vazio. Guardar o texto válido como informado, sem deduplicar; mostrar como texto literal. |
| `status` | enum `pending` \| `completed` | `pending` no cadastro. Exibir `Pendente` ou `Concluída`, respectivamente. |

Uma lista contém zero ou mais tarefas; não há entidades de conta ou relacionamento externo. A ordem de inserção é mantida pela sequência da lista, sem novo recurso de ordenação.

## Transições (FR-002, FR-004–FR-007)

| Evento | Antes | Depois |
|---|---|---|
| Cadastrar com título válido | ID novo | Acrescentar `pending`; títulos iguais são permitidos. |
| Cadastrar com título inválido | Qualquer lista | Não criar nem salvar; informar que o título é obrigatório. |
| Concluir por ID | Tarefa `pending` | Apenas a tarefa correspondente passa a `completed`; continua listada. |
| Excluir por ID | Tarefa `pending` ou `completed` | Remover apenas a tarefa correspondente da lista e da persistência; sem lixeira. |
| Ação com ID ausente ou conclusão repetida | ID ausente ou tarefa `completed` | Nenhuma alteração ou gravação. |

Sem edição ou reabertura. Mutação válida é aplicada à lista visível somente após salvar com sucesso.

## Esquema de persistência v1 (FR-007)

- Storage: `localStorage`, chave `demo.personal-tasks`, valor JSON com os campos `version` (inteiro `1`) e `tasks` (array de `Tarefa`). Chave ausente representa lista vazia.
- Carregar antes da primeira renderização da lista. Verificar envelope, versão, tipo e invariantes dos campos e unicidade de IDs antes de aceitar o conjunto; se JSON/estrutura inválida, versão incompatível ou acesso indisponível, informar erro e não sobrescrever nem oferecer estado vazio enganoso. Não capturar acesso a `window.localStorage` fora do tratamento de erros.
- Salvar o documento inteiro por alteração concluída, apenas na chave dedicada; não limpar outras chaves. Exclusão não deixa registro a restaurar. Falha de escrita mantém a lista anterior e informa que a operação não foi salva.
- Não há banco externo, migração inicial, schema legado, segredos ou dados de produção. Se um formato futuro for adotado, planejar conversão separadamente; v1 não converte nem descarta versões desconhecidas.
- Fixtures: criar documentos v1 com IDs fixos de teste, incluindo duplicatas de título, tarefas em ambos os estados e registros inválidos para testar rejeição. Usar dublê de `Storage` nos unitários e contexto Chromium novo por cenário de aceite. Todos os dados são sintéticos.

Ver a [interface](contracts/web-ui.md) e o [quickstart](quickstart.md) para resultados observáveis.
