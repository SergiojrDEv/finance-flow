# Spec: Resumo Financeiro

## Objetivo

Mostrar uma leitura clara do mes sem duplicar informacoes.

## Formula principal

```text
disponivel = receitas - despesas - investimentos
```

## Cards principais

- Receitas.
- Despesas.
- Investido no mes.
- Disponivel para movimentacao.

## Regras

- Receitas e despesas nao devem ser misturadas como "movimentado".
- Disponivel para movimentacao deve usar a formula principal.
- Investimentos reduzem o disponivel imediato, mas nao devem ser tratados como despesa.
- O painel deve evitar repetir o mesmo valor com nomes diferentes.

## Saude financeira

Saude financeira deve refletir o estado do mes considerando:

- saldo disponivel;
- percentual da receita comprometida;
- gastos acima do limite;
- presenca de receitas;
- presenca de despesas.

## Criterios de aceite

- Se receitas, despesas ou investimentos mudarem, o resumo deve atualizar.
- Se o disponivel for negativo, o painel deve explicar quanto falta para voltar ao positivo.
- Se nao houver dados suficientes, o painel deve informar isso sem mostrar conclusoes falsas.

## Implementacao inicial

- Caso de uso puro: `src/application/dashboard/buildFinancialSummary.js`.
- Testes: `tests/dashboard/buildFinancialSummary.test.js`.
- Status: validacao automatizada inicial, ainda nao conectado ao runtime principal.
