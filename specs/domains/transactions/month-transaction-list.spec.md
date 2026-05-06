# Spec: Lancamentos do Mes

## Objetivo

Permitir que o usuario consulte os lancamentos do mes selecionado de forma estavel, filtravel e sem misturar responsabilidades da UI com regra de negocio.

## Regras

- A lista deve considerar apenas lancamentos cujo `date` pertence ao mes selecionado.
- A lista deve aceitar filtro por tipo:
  - `all`;
  - `income`;
  - `expense`;
  - `investment`.
- A busca deve procurar em descricao, categoria, subcategoria, conta e metodo de pagamento.
- A ordenacao padrao deve mostrar lancamentos mais recentes primeiro.
- Lancamentos antigos ou parcialmente inconsistentes nao devem quebrar a lista.
- Tipo ausente ou invalido deve ser tratado como `expense` apenas para exibicao defensiva.
- Campo textual ausente deve ser tratado como vazio.

## Criterios de aceite

- Ao existir lancamento no mes selecionado, ele aparece na tabela.
- Ao buscar por texto existente em descricao, categoria, subcategoria, conta ou pagamento, a lista retorna o item.
- Ao filtrar por tipo, a lista retorna apenas itens daquele tipo.
- Ao receber dados antigos com tipo/campo ausente, a lista continua renderizando.
- A UI nao deve implementar filtro, busca e ordenacao diretamente.

## Implementacao inicial

- Selector de aplicacao: `src/application/transactions/buildMonthTransactionList.js`.
- Runtime consumidor: `src/transactions/index.js`.
- Testes: `tests/application/transactions/buildMonthTransactionList.test.js`.

## Status

Validacao inicial.
