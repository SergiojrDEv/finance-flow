# Principios Arquiteturais

## Base atual

O Finance Flow esta em JavaScript modular, com app estavel no `main`.

Qualquer evolucao para DDD, TypeScript, Angular ou backend Go deve preservar o app atual ate a nova camada estar validada.

## Camadas desejadas

```text
specs -> domain -> application -> infrastructure -> composition -> presentation
```

## Regras

- Especificacao vem antes de implementacao.
- O dominio nao deve depender de Supabase, DOM, localStorage ou navegador.
- Casos de uso recebem dados e devolvem resultados previsiveis.
- Infraestrutura adapta Supabase, localStorage e APIs externas.
- Composition root monta casos de uso com adaptadores concretos.
- A apresentacao apenas renderiza e coleta entrada do usuario.
- Autenticacao, bootstrap e carregamento inicial ficam por ultimo em migracoes grandes.
- Mudancas de runtime devem entrar por shadow mode ou feature flag quando houver risco.

## Shadow mode

Shadow mode significa calcular com a camada nova em paralelo, comparar com o resultado antigo e so substituir quando os resultados estiverem consistentes.

O shadow mode deve:

- nao alterar o resultado visivel para o usuario;
- registrar divergencias de forma comparavel;
- permitir desligamento simples;
- entrar antes de substituir o fluxo antigo.

## Criterio para considerar uma area migrada

Uma area so e considerada migrada quando tem:

- especificacao aprovada;
- caso de uso isolado;
- testes ou validacao objetiva;
- mapeamento de dados documentado;
- integracao sem quebrar fluxo existente.
