# ADR 0001: Adotar SDD com DDD e migracao gradual para TypeScript

## Status

Aceita.

## Contexto

O projeto ja teve instabilidade quando mudancas arquiteturais foram conectadas cedo demais ao runtime principal. O problema nao foi DDD ou TypeScript em si, mas a ligacao prematura da nova arquitetura em areas criticas como bootstrap, autenticacao, sync e renderizacao inicial.

## Decisao

Adotar Spec-Driven Development como processo principal e DDD como organizacao tecnica.

O caminho sera:

1. Manter `main` estavel.
2. Criar especificacoes antes de novas mudancas relevantes.
3. Evoluir dominio e casos de uso em paralelo.
4. Usar shadow mode para calculos e persistencia quando houver risco.
5. Migrar UI, TypeScript, Angular e backend Go apenas depois que contratos e casos de uso estiverem maduros.

## Consequencias

- O desenvolvimento fica mais lento no comeco, mas mais seguro.
- Agentes de IA recebem contexto versionado e verificavel.
- A arquitetura nova deixa de ser uma aposta e vira uma migracao controlada.
- O app atual continua funcionando durante a transicao.
