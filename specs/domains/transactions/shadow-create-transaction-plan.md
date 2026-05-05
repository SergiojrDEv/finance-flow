# Plano: Shadow Mode para Criacao de Lancamentos

## Objetivo

Conectar a arquitetura nova de criacao de lancamentos em modo comparacao, sem mudar o comportamento visivel do app.

## Ponto de integracao

Arquivo:

```text
src/transactions/index.js
```

Funcao:

```text
addTransaction(event)
```

Ponto exato:

- depois de montar o array `transactions`;
- antes de `state.transactions.push(...transactions)`.

## Regra principal

O fluxo legado continua sendo a fonte de gravacao enquanto o shadow mode estiver ativo.

```text
legado cria -> novo fluxo calcula em paralelo -> compara -> legado salva
```

## O que comparar

Para cada item gerado pelo legado, comparar:

- tipo;
- descricao;
- categoria;
- subcategoria;
- conta;
- valor;
- data;
- vencimento;
- status;
- pagamento;
- recorrencia.

## Parcelas e recorrencia

O legado pode gerar mais de um lancamento quando:

- pagamento for credito parcelado;
- recorrencia mensal tiver repeticao maior que 1.

No shadow mode, cada item legado deve ser comparado com um draft equivalente da nova arquitetura.

O shadow mode nao deve tentar substituir a regra de parcelas ainda.

## Onde registrar divergencias

Inicialmente:

```text
console.warn("[Finance Flow Shadow]", detalhes)
```

Depois:

```text
state.diagnostics.shadowTransactions
```

ou uma tabela futura de auditoria.

## Flag de ativacao

Primeira versao sugerida:

```js
const ENABLE_TRANSACTION_SHADOW = false;
```

A flag deve nascer desligada.

Status atual:

- implementada em `src/transactions/index.js`;
- desligada por padrao;
- centralizada em `src/core/featureFlags.js`;
- compara antes de `state.transactions.push(...transactions)`;
- usa `src/infrastructure/diagnostics/shadowDiagnostics.js` para divergencias ou erros;
- expoe diagnosticos tecnicos em `window.financeFlowDiagnostics.shadow`;
- nao altera o fluxo visivel.

Ativacao para teste local:

```text
?ff_transactionShadow=true
```

ou:

```js
localStorage.setItem("finance-flow:transactionShadow", "1")
```

## Criterios de aceite

- Shadow mode desligado nao altera nada.
- Shadow mode ligado nao altera o array final salvo pelo legado.
- Divergencias sao registradas, nao exibidas para o usuario comum.
- Erro no shadow mode nao impede salvar pelo fluxo legado.
- Testes unitarios continuam verdes.

## Fora de escopo neste passo

- Substituir `state.transactions.push`.
- Alterar formulario.
- Alterar Supabase.
- Alterar login ou bootstrap.

## Implementacao

- Composition root usado: `src/infrastructure/composition/createTransactionServices.js`.
- Comparador usado: `src/infrastructure/shadow/compareTransactionCreation.js`.
- Executor testavel: `src/infrastructure/shadow/runTransactionCreationShadow.js`.
- Diagnostico usado: `src/infrastructure/diagnostics/shadowDiagnostics.js`.
- API tecnica: `src/infrastructure/diagnostics/installDiagnosticsApi.js`.
- Ponto conectado: `src/transactions/index.js`.

## Validacao manual

- Roteiro: `specs/domains/transactions/manual-shadow-test.md`.
