# Spec: Remover Lancamento

## Objetivo

Permitir remover um lancamento existente com validacao de existencia e usuario.

## Regras gerais

- Lancamento deve existir.
- Lancamento deve pertencer ao usuario autenticado quando houver usuario associado.
- Remocao deve retornar o lancamento removido para auditoria futura.
- Remocao nao deve afetar outros lancamentos.

## Criterios de aceite

- Remover lancamento existente deve concluir com sucesso.
- Remover lancamento inexistente deve retornar erro.
- Remover lancamento de outro usuario deve retornar erro.
- Repositorio local deve remover apenas o item informado.

## Implementacao inicial

- Caso de uso: `src/application/transactions/DeleteTransactionUseCase.js`.
- Porta de persistencia: `src/application/transactions/ports/TransactionRepository.js`.
- Adaptador local: `src/infrastructure/transactions/LocalTransactionRepository.js`.
- Testes: `tests/application/transactions/DeleteTransactionUseCase.test.js` e `tests/infrastructure/transactions/LocalTransactionRepository.test.js`.
- Status: validacao automatizada inicial, ainda nao conectada ao runtime principal.
