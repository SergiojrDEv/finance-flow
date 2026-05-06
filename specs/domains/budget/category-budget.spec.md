# Spec: Orcamento por Categoria

## Objetivo

Permitir que o usuario defina uma regra semanal e mensal para cada categoria de despesa.

## Conceitos

Orcamento por categoria e uma regra de limite para acompanhar o ritmo de gasto.

Periodo semanal mostra a semana em foco.

Periodo mensal mostra o fechamento do mes.

## Regras

- Orcamento pertence a uma categoria de despesa.
- Limite semanal nao pode ser negativo.
- Limite mensal nao pode ser negativo.
- Limite semanal pode ser zero.
- Limite mensal pode ser zero.
- Se semanal e mensal forem zero, a regra existe mas nao gera alerta.
- Orcamento nao deve ser aplicado a receita ou investimento.

## Criterios de aceite

- Usuario consegue definir limite semanal e mensal.
- Usuario consegue editar limite semanal e mensal.
- Sistema recusa valores negativos.
- Sistema recusa categoria vazia.
- Regra atualizada preserva categoria.

## Implementacao inicial

- Validacao: `src/application/budget/validateCategoryBudgetDraft.js`.
- Entidade de dominio: `src/domain/budget/CategoryBudget.js`.
- Caso de uso: `src/application/budget/UpsertCategoryBudgetUseCase.js`.
- Porta de persistencia: `src/application/budget/ports/CategoryBudgetRepository.js`.
- Adaptador local: `src/infrastructure/budget/LocalCategoryBudgetRepository.js`.
- Composition root: `src/infrastructure/composition/createBudgetServices.js`.
- Runtime consumidor: `src/settings/index.js`.
- Testes: `tests/budget/*.test.js`, `tests/domain/budget/*.test.js`, `tests/application/budget/*.test.js`, `tests/infrastructure/budget/*.test.js` e `tests/infrastructure/composition/createBudgetServices.test.js`.

## Status

Runtime de salvamento de regra semanal/mensal usa caso de uso e repositorio local.
- Status: validacao automatizada inicial, ainda nao conectada ao runtime principal.
