<!--
Sync Impact Report
- Versão: sem versão (modelo não preenchido) → 1.0.0, edição inicial.
- Princípios introduzidos: especificação, qualidade do código, segurança, testes e revisão.
- Seções preenchidas: Decisões Técnicas; Fluxo de Entrega e Checkpoints; Governance.
- Seções removidas: nenhuma.
- Ratificação da versão 1.0.0 aprovada explicitamente pelo responsável humano em 2026-11-22.
-->

# Fábrica de Software Agêntica Constitution

## Core Principles

### I. Especificação antes da implementação

Toda entrega DEVE partir de uma especificação aprovada, com requisitos e critérios de aceitação
verificáveis. Plano, tarefas e testes DEVEM ser rastreáveis à especificação. Mudanças de escopo
DEVEM voltar à especificação e obter nova aprovação humana antes de orientar a implementação.

### II. Código limpo, modular e organizado

O código DEVE usar nomes claros, separar responsabilidades e manter dependências explícitas.
Cada módulo DEVE ter um propósito identificável e poder ser testado sem depender de detalhes
internos de outros módulos. Arquivos e testes DEVEM seguir a organização definida no plano.
Abstrações e dependências novas DEVEM atender a uma necessidade demonstrável.

### III. Segurança por padrão

Pessoas, agentes e serviços DEVEM operar com o menor privilégio necessário. Entradas de fontes
não confiáveis DEVEM ser validadas nas fronteiras do sistema. Segredos NÃO DEVEM ser incluídos
no código, nos artefatos ou nos logs. A entrega NÃO DEVE avançar com falha de segurança bloqueante.

### IV. Testes com evidência

Cada mudança de comportamento DEVE ter testes proporcionais ao risco e rastreáveis aos critérios
de aceitação aplicáveis. Correções de defeitos DEVEM incluir testes de regressão. A suíte e os
testes novos DEVEM ser executados na branch da entrega, com comandos e resultados registrados.
Testes obrigatórios falhando bloqueiam a publicação.

### V. Revisão independente

Uma pessoa ou agente que não tenha implementado a mudança DEVE revisar o código e os testes antes
da publicação, verificando aderência à especificação, manutenibilidade, segurança e cobertura dos
riscos. Achados bloqueantes DEVEM ser corrigidos e reavaliados antes do avanço.

## Decisões Técnicas

A fábrica NÃO impõe fornecedor, linguagem, framework ou arquitetura. O Arquiteto DEVE escolher
e justificar a linguagem, os frameworks e a arquitetura no plano de cada projeto, com base
nos requisitos aprovados, nas restrições e nos riscos. Complexidade adicional DEVE ser
justificada no plano.

## Fluxo de Entrega e Checkpoints

- **Checkpoint 1 — Especificação:** o humano DEVE aprovar explicitamente a especificação após
  sua apresentação. A aprovação DEVE ser registrada. Iniciar o planejamento exige também pedido
  explícito para continuar e confirmação específica para a chamada ao Arquiteto.
- **Entre checkpoints:** o fluxo DEVE passar por plano, tarefas, análise de consistência,
  implementação, revisão, QA e publicação, nessa ordem. Para entregar o PR no segundo checkpoint,
  as verificações da CI DEVEM passar ou, quando não houver CI, a validação local DEVE ser registrada.
- **Checkpoint 2 — Merge:** o humano realiza o merge após receber o PR e as evidências de
  validação. Agentes NÃO DEVEM realizar nem automatizar esse merge. A entrega só é concluída
  quando o merge for confirmado.

## Governance

Esta constituição rege as entregas da fábrica; o fluxo operacional detalha como aplicar suas
regras, sem dispensar princípios ou checkpoints. O plano e a revisão do PR DEVEM verificar
conformidade e registrar violações e justificativas. Justificativas NÃO substituem aprovações
humanas nem permitem avançar com bloqueios.

Emendas DEVEM documentar motivação, impacto e transição quando aplicável, e só entram em vigor
após aprovação humana registrada. A versão segue SemVer: MAJOR para mudanças incompatíveis,
MINOR para novos princípios ou ampliações materiais e PATCH para esclarecimentos sem mudança
de regra.

**Version**: 1.0.0 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
