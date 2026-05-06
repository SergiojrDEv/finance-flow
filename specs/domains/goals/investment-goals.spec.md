# Spec: Metas de Investimento

## Objetivo

Permitir que o usuario crie, edite e remova metas de investimento sem perder valores acumulados ou vinculos com categorias.

## Regras

- Meta deve ter nome, categoria de investimento e valor alvo maior que zero.
- Meta pode ter valor acumulado (`currentAmount`) preservado ao editar nome, categoria ou alvo.
- Meta removida deve ser arquivada, nao apagada fisicamente, para reduzir risco de perda em sincronizacao.
- Cor da meta deve ser preservada ao editar, salvo quando explicitamente alterada.
- A UI nao deve manipular diretamente a regra principal de criacao, edicao e arquivamento.

## Criterios de aceite

- Criar meta valida adiciona item ao catalogo.
- Editar meta preserva acumulado e cor.
- Remover meta marca `isArchived=true`.
- Meta invalida nao deve ser salva.

## Implementacao inicial

- Validacao: `src/application/goals/validateGoalDraft.js`.
- Entidade de dominio: `src/domain/goals/Goal.js`.
- Casos de uso:
  - `src/application/goals/CreateGoalUseCase.js`;
  - `src/application/goals/UpdateGoalUseCase.js`;
  - `src/application/goals/ArchiveGoalUseCase.js`.
- Porta de persistencia: `src/application/goals/ports/GoalRepository.js`.
- Adaptador local: `src/infrastructure/goals/LocalGoalRepository.js`.
- Composition root: `src/infrastructure/composition/createGoalServices.js`.
- Runtime consumidor: `src/settings/index.js`.
- Testes: `tests/goals/*.test.js`, `tests/domain/goals/*.test.js`, `tests/application/goals/*.test.js` e `tests/infrastructure/composition/createGoalServices.test.js`.

## Status

Runtime de criacao, edicao e remocao usa casos de uso e repositorio local.
