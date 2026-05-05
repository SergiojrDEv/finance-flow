# Roteiro Manual: Shadow Mode de Criacao de Lancamentos

## Objetivo

Validar no navegador que o fluxo legado continua funcionando enquanto a arquitetura nova calcula em paralelo.

Este roteiro deve ser executado antes de qualquer tentativa de substituir `state.transactions.push(...transactions)` pelo caso de uso novo.

## Pre-condicoes

- App carregando normalmente.
- Usuario autenticado.
- Branch de teste publicada ou rodando localmente.
- Console do navegador aberto.

## Ativar shadow mode

No console:

```js
localStorage.setItem("finance-flow:transactionShadow", "1")
location.reload()
```

Alternativa via URL:

```text
?ff_transactionShadow=true
```

## Limpar diagnosticos antes do teste

No console:

```js
window.financeFlowDiagnostics.shadow.clear()
```

## Consultar diagnosticos

No console:

```js
window.financeFlowDiagnostics.shadow.list()
```

Resultado esperado quando tudo estiver equivalente:

```js
[]
```

## Cenario 1: Receita simples

Criar:

- Tipo: Receita.
- Descricao: Salario teste shadow.
- Categoria: Salario.
- Conta: Conta corrente.
- Valor: 1000.
- Data: data atual.
- Status: Pago.

Esperado:

- Lancamento aparece no historico.
- Dashboard atualiza receita.
- `window.financeFlowDiagnostics.shadow.list()` retorna vazio.

## Cenario 2: Despesa Pix simples

Criar:

- Tipo: Despesa.
- Descricao: Mercado teste shadow.
- Categoria: Alimentacao.
- Subcategoria: Mercado, se existir.
- Conta: Carteira ou Conta corrente.
- Valor: 50.
- Data: data atual.
- Vencimento: data atual.
- Status: Pago.
- Pagamento: Pix.
- Recorrencia: Nao repetir.

Esperado:

- Lancamento aparece no historico.
- Dashboard atualiza despesas.
- Forma de pagamento aparece como Pix.
- Diagnosticos ficam vazios ou apontam divergencia explicavel.

## Cenario 3: Despesa cartao de credito parcelada

Criar:

- Tipo: Despesa.
- Descricao: Compra parcelada teste shadow.
- Categoria: Outros.
- Conta: Cartao de credito.
- Valor: 300.
- Pagamento: Credito.
- Parcelas: 3.
- Data: data atual.
- Vencimento: data atual.

Esperado:

- Legado cria 3 lancamentos.
- Shadow compara cada parcela separadamente.
- Divergencias, se existirem, devem ser sobre campos ainda fora do escopo, como grupo de parcela.
- Nenhum erro deve impedir o salvamento.

## Cenario 4: Despesa recorrente mensal

Criar:

- Tipo: Despesa.
- Descricao: Assinatura teste shadow.
- Categoria: Outros.
- Valor: 20.
- Pagamento: Pix.
- Recorrencia: Mensal.
- Repetir por: 3.

Esperado:

- Legado cria 3 lancamentos.
- Shadow compara cada item equivalente.
- Nenhum erro deve impedir o salvamento.

## Cenario 5: Investimento simples

Criar:

- Tipo: Investimento.
- Descricao: Tesouro teste shadow.
- Categoria: Renda fixa.
- Conta: Corretora.
- Valor: 200.
- Data: data atual.
- Status: Pago.

Esperado:

- Lancamento aparece como investimento.
- Dashboard atualiza investido no mes.
- Investimento reduz disponibilidade, mas nao entra como despesa.
- Diagnosticos ficam vazios.

## Desativar shadow mode

No console:

```js
localStorage.removeItem("finance-flow:transactionShadow")
location.reload()
```

## Criterio para avancar

Podemos avancar para substituicao parcial do fluxo somente quando:

- todos os cenarios salvarem pelo legado sem erro;
- shadow mode nao bloquear nenhuma acao;
- divergencias forem nulas ou documentadas;
- divergencias documentadas tiverem decisao: corrigir, aceitar ou deixar fora do escopo.

## Registro de resultado

Preencher manualmente ao executar:

| Data | Ambiente | Cenario | Resultado | Divergencias | Decisao |
| --- | --- | --- | --- | --- | --- |
|  |  | Receita simples |  |  |  |
|  |  | Despesa Pix simples |  |  |  |
|  |  | Despesa credito parcelada |  |  |  |
|  |  | Despesa recorrente mensal |  |  |  |
|  |  | Investimento simples |  |  |  |
