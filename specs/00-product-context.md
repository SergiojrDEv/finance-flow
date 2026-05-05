# Contexto do Produto

## Produto

Finance Flow e um aplicativo de controle financeiro pessoal focado em clareza, praticidade e evolucao gradual para uma arquitetura mais robusta.

## Publico

O produto precisa atender dois perfis:

- Usuario familiarizado com tecnologia e organizacao financeira, que valoriza controle detalhado.
- Usuario leigo, que precisa de telas simples, didaticas e com menos repeticao visual.

## Promessa principal

Permitir que o usuario entenda rapidamente:

- quanto recebeu;
- quanto gastou;
- quanto investiu;
- quanto ainda esta disponivel para movimentacao imediata;
- onde o dinheiro esta pesando mais.

## Formula base

Disponivel para movimentacao imediata:

```text
receitas - despesas - investimentos
```

## Principios de experiencia

- Receita, despesa e investimento sao conceitos diferentes e podem ter telas diferentes.
- Campos que nao fazem sentido para um tipo de movimento nao devem aparecer.
- O app deve parecer mais com aplicativo do que com planilha.
- O painel deve mostrar resumo; telas dedicadas devem cuidar de criacao, edicao e detalhes.
- O usuario deve conseguir ajustar categorias, etiquetas, contas, cartoes, metas e orcamentos sem nomes fixos.

## Fora de escopo por enquanto

- Open Banking.
- Backend Go em producao.
- Migracao completa para Angular.
- Autenticacao 2FA.

Esses temas continuam desejados, mas so entram depois da base SDD/DDD estar segura.
