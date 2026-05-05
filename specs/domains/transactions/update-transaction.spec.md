# Spec: Editar Lancamento

## Objetivo

Permitir editar um lancamento existente preservando as mesmas regras de tipo usadas na criacao.

## Regras gerais

- Lancamento deve existir.
- Lancamento deve pertencer ao usuario autenticado.
- Valor deve continuar maior que zero.
- Data deve continuar valida.
- Receita e investimento nao devem aceitar campos exclusivos de despesa.
- Despesa pode aceitar pagamento, vencimento, subcategoria e recorrencia.

## Campos editaveis

- tipo;
- descricao;
- categoria;
- subcategoria, apenas despesa;
- conta;
- valor;
- data;
- vencimento, apenas despesa;
- status;
- pagamento, apenas despesa.

## Criterios de aceite

- Editar lancamento inexistente deve retornar erro.
- Editar lancamento de outro usuario deve retornar erro.
- Editar receita com campo de pagamento deve retornar erro.
- Editar despesa valida deve atualizar os dados.
- Atualizacao deve alterar `updatedAt`.
- Atualizacao nao deve alterar `createdAt`.

## Implementacao inicial

- Caso de uso: `src/application/transactions/UpdateTransactionUseCase.js`.
- Porta de persistencia: `src/application/transactions/ports/TransactionRepository.js`.
- Adaptador local: `src/infrastructure/transactions/LocalTransactionRepository.js`.
- Testes: `tests/application/transactions/UpdateTransactionUseCase.test.js` e `tests/infrastructure/transactions/LocalTransactionRepository.test.js`.
- Status: validacao automatizada inicial, ainda nao conectada ao runtime principal.
