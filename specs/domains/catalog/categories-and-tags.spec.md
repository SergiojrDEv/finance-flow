# Spec: Categorias e Etiquetas

## Objetivo

Permitir que o usuario organize seus lancamentos com categorias e etiquetas editaveis.

## Conceitos

Categoria e o agrupamento principal.

Etiqueta e uma classificacao menor e opcional dentro do planejamento do usuario.

## Regras

- Categorias predefinidas podem existir, mas devem ser editaveis.
- O usuario pode criar, editar, desativar ou remover categorias.
- O usuario pode criar, editar, desativar ou remover etiquetas.
- Etiquetas podem ser ligadas a um tipo de lancamento e a uma categoria principal.
- O app nao deve forcar o usuario a manter etiquetas que nao usa.

## Criterios de aceite

- Usuario consegue criar uma categoria com nome, tipo, cor e limite mensal opcional.
- Usuario consegue editar nome, tipo, cor e limite.
- Usuario consegue criar etiqueta personalizada.
- Usuario consegue remover ou desativar etiqueta sem quebrar lancamentos antigos.
- Lancamentos antigos com etiqueta removida devem continuar visiveis.

## Implementacao inicial

- Validacao de categoria: `src/application/catalog/validateCategoryDraft.js`.
- Entidade de dominio: `src/domain/catalog/Category.js`.
- Caso de uso: `src/application/catalog/CreateCategoryUseCase.js`.
- Porta de persistencia: `src/application/catalog/ports/CategoryRepository.js`.
- Validacao de etiqueta: `src/application/catalog/validateCategoryTagDraft.js`.
- Entidade de etiqueta: `src/domain/catalog/CategoryTag.js`.
- Caso de uso de etiqueta: `src/application/catalog/CreateCategoryTagUseCase.js`.
- Porta de persistencia de etiqueta: `src/application/catalog/ports/CategoryTagRepository.js`.
- Casos de uso de edicao/arquivamento: `src/application/catalog/UpdateCategoryUseCase.js`, `src/application/catalog/ArchiveCategoryUseCase.js`, `src/application/catalog/UpdateCategoryTagUseCase.js`, `src/application/catalog/ArchiveCategoryTagUseCase.js`.
- Adaptadores locais: `src/infrastructure/catalog/LocalCategoryRepository.js` e `src/infrastructure/catalog/LocalCategoryTagRepository.js`.
- Composition root: `src/infrastructure/composition/createCatalogServices.js`.
- Shadow mode: `src/infrastructure/shadow/compareCatalogSnapshot.js` e `src/infrastructure/shadow/runCatalogShadow.js`.
- Roteiro manual: `specs/domains/catalog/manual-catalog-shadow-test.md`.
- Testes: `tests/catalog/validateCategoryDraft.test.js`, `tests/catalog/validateCategoryTagDraft.test.js`, `tests/domain/catalog/*.test.js` e `tests/application/catalog/*.test.js`.
- Status: validacao automatizada inicial para criar, editar e arquivar categorias/etiquetas, conectada ao runtime de ajustes para criacao, edicao e arquivamento.
