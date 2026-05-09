# Spec: Fluxos financeiros por tipo

Status: em andamento

## Objetivo

Fazer receita, despesa e investimento parecerem fluxos diferentes para o usuario, mantendo as mesmas regras de dominio e o mesmo schema.

## Problema

O formulario de lancamento ainda parece muito parecido entre os tipos. Para usuario leigo, salario, gasto e aporte podem parecer a mesma operacao, mesmo tendo impacto financeiro diferente.

## Criterios de aceite

- Receita deve usar linguagem de origem da renda, conta de destino e data de recebimento.
- Investimento deve usar linguagem de aporte, categoria de investimento, conta de origem e data do aporte.
- Despesa deve manter pagamento, vencimento, parcelas, subcategoria e recorrencia.
- Receita e investimento nao devem mostrar subcategoria, pagamento, vencimento, parcelas ou recorrencia.
- O modal de edicao deve seguir a mesma diferenciacao do formulario.
- Build e testes devem continuar passando.

## Fora de escopo neste corte

- Alterar banco, Supabase, login ou sincronizacao.
- Criar novas rotas ou abas.
- Redesenhar completamente o dashboard.
