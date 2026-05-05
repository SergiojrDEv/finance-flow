# ADR 0003: Typecheck gradual nas camadas DDD

## Status

Aceita.

## Contexto

O app ainda roda em JavaScript modular no navegador. A migracao anterior que tentou ligar arquitetura nova direto ao runtime causou tela branca e instabilidade. Mesmo assim, precisamos preparar o caminho para TypeScript, Angular ou outro frontend sem perder a versao estavel atual.

## Decisao

Adicionar TypeScript em modo gradual, com `allowJs` e `checkJs`, limitado inicialmente a:

- `src/domain`
- `src/application`
- `src/infrastructure`

Ficam fora deste primeiro typecheck:

- `src/app.js`
- `src/auth`
- `src/supabase`
- testes

## Consequencias

- As camadas DDD comecam a receber verificacao estatica.
- O runtime do app nao muda.
- A UI e o bootstrap continuam fora do escopo ate os contratos de dominio e infraestrutura estabilizarem.
- A migracao para arquivos `.ts` pode acontecer depois, por modulo, sem obrigar troca de framework.
