# ADR 0002: Usar shadow mode antes de substituir criacao de lancamentos

## Status

Aceita.

## Contexto

O fluxo de criacao de lancamentos e critico porque alimenta dashboard, historico, orcamentos, metas, exportacao e sincronizacao. Substituir esse fluxo diretamente pode causar perda de dados, duplicidade ou tela branca.

## Decisao

Antes de substituir a criacao legada de lancamentos, a nova arquitetura sera conectada em shadow mode.

Nesse modo:

- o legado continua salvando;
- a arquitetura nova calcula em paralelo;
- divergencias sao registradas;
- erros do shadow nao bloqueiam o usuario.

## Consequencias

- A migracao fica mais lenta, mas segura.
- Podemos medir divergencias antes de trocar o fluxo.
- O app continua estavel enquanto a arquitetura nova amadurece.
