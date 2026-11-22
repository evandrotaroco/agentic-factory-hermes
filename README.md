# Fábrica de Software Agêntica no Hermes

Esta fábrica organiza a entrega de uma feature, da especificação ao pull request. O [Orquestrador](.hermes.md) carrega seis [skills](.hermes/skills/) via `skill_view` e delega uma etapa por vez com `delegate_task`: Analista de Requisitos, Arquiteto, Criador de Tarefas, Desenvolvedor, Revisor de Código e QA. Cada subagente trabalha em uma conversa separada; o Orquestrador valida os resultados e controla o estado, os commits e a publicação.

## Fluxo e aprovações

O fluxo E0–E8 passa por descoberta, especificação, plano, tarefas, análise de consistência, implementação, revisão, QA e publicação com verificações de CI. O GitHub Spec Kit v1.4.3 fornece as skills, os scripts e os templates usados para produzir e validar os artefatos em `specs/`. A [constituição](.specify/memory/constitution.md) define as regras de entrega.

1. **Especificação:** uma pessoa aprova a spec. Para começar o plano, também precisa pedir a continuação e confirmar a chamada ao Arquiteto.
2. **Merge:** depois das verificações, o Orquestrador apresenta o PR. Só uma pessoa faz o merge; a entrega termina quando o Orquestrador o confirma.

A cada conclusão de um subagente, o Orquestrador usa [`scripts/notify-discord.py`](scripts/notify-discord.py) para notificar o Discord. A mensagem informa apenas agente, etapa, status e uma frase padronizada.

A primeira execução deve ser supervisionada, em um checkout de teste limpo e autorizado. Conversas separadas não isolam arquivos ou credenciais; operações Git/GitHub com efeitos exigem confirmação humana.

Base da adaptação: [Fábrica de Software Agêntica, de André Menegassi](https://github.com/andremenegassi/fabrica-software-agentica).
