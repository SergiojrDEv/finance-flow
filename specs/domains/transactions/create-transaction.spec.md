# Spec: Criar Lancamento

## Objetivo

Permitir que o usuario registre receita, despesa ou investimento com campos coerentes para cada tipo.

## Tipos

- `income`: entrada de dinheiro.
- `expense`: saida de dinheiro.
- `investment`: dinheiro direcionado para investimento.

## Regras gerais

- Todo lancamento deve ter descricao, valor, data, tipo, categoria e conta.
- Valor deve ser maior que zero.
- Data deve ser valida.
- Lancamento deve pertencer ao usuario autenticado.

## Receita

Receita representa entrada de dinheiro.

Campos esperados:

- descricao;
- categoria;
- conta;
- valor;
- data;
- status.

Campos que nao devem aparecer por padrao:

- pagamento;
- vencimento;
- recorrencia;
- repetir por;
- subcategoria obrigatoria.

## Despesa

Despesa representa consumo ou compromisso financeiro.

Campos esperados:

- descricao;
- categoria;
- subcategoria opcional;
- conta ou cartao;
- valor;
- data;
- status;
- pagamento;
- vencimento;
- recorrencia;
- repetir por.

## Investimento

Investimento representa dinheiro separado para formar patrimonio.

Campos esperados:

- descricao;
- categoria;
- conta ou corretora;
- valor;
- data;
- status.

Campos que nao devem aparecer por padrao:

- pagamento;
- vencimento;
- recorrencia;
- repetir por;
- subcategoria obrigatoria.

## Criterios de aceite

- Ao selecionar receita, a tela remove campos especificos de despesa.
- Ao selecionar investimento, a tela remove campos especificos de despesa.
- Ao selecionar despesa, a tela mostra pagamento, vencimento e recorrencia.
- Lancamento invalido nao deve ser salvo.
- Lancamento valido deve aparecer no historico do mes.

## Implementacao inicial

- Regras de campos: `src/application/transactions/transactionFormRules.js`.
- Validacao de draft: `src/application/transactions/validateTransactionDraft.js`.
- Criacao de serie/parcelas/recorrencia: `src/application/transactions/buildTransactionSeries.js`.
- Caso de uso: `src/application/transactions/CreateTransactionUseCase.js`.
- Caso de uso de serie: `src/application/transactions/CreateTransactionSeriesUseCase.js`.
- Porta de persistencia: `src/application/transactions/ports/TransactionRepository.js`.
- Entidade de dominio: `src/domain/transactions/Transaction.js`.
- Adaptador local: `src/infrastructure/transactions/LocalTransactionRepository.js`.
- Composition root: `src/infrastructure/composition/createTransactionServices.js`.
- Shadow adapter: `src/infrastructure/shadow/compareTransactionCreation.js`.
- Plano de integracao segura: `specs/domains/transactions/shadow-create-transaction-plan.md`.
- Testes: `tests/transactions/transactionFormRules.test.js`, `tests/transactions/validateTransactionDraft.test.js`, `tests/application/transactions/CreateTransactionUseCase.test.js`, `tests/application/transactions/CreateTransactionSeriesUseCase.test.js` e `tests/application/transactions/buildTransactionSeries.test.js`.
- Status: runtime de criacao usa builder de serie e caso de uso de aplicacao.
