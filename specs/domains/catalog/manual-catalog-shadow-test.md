# Roteiro Manual: Shadow Mode de Catalogo

## Objetivo

Validar no navegador que o catalogo atual continua funcionando enquanto a arquitetura nova de categorias e etiquetas compara os mesmos dados em paralelo.

Este roteiro deve ser executado antes de conectar os casos de uso novos diretamente na tela de Ajustes.

## Pre-condicoes

- App carregando normalmente.
- Usuario autenticado.
- Console do navegador aberto.
- API tecnica disponivel em `window.financeFlowDiagnostics`.

## Ativar catalogShadow

No console:

```js
localStorage.setItem("finance-flow:catalogShadow", "1")
location.reload()
```

Alternativa via URL:

```text
?ff_catalogShadow=true
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

## Cenario 1: Carregamento inicial

Passos:

- Ativar `catalogShadow`.
- Recarregar o app.
- Abrir o console.
- Consultar `window.financeFlowDiagnostics.shadow.list()`.

Esperado:

- App carrega normalmente.
- Nenhuma tela branca.
- Diagnosticos ficam vazios.

## Cenario 2: Categoria existente

Passos:

- Ir em Ajustes.
- Verificar categorias existentes.
- Consultar diagnosticos.

Esperado:

- Categorias aparecem normalmente.
- Shadow nao registra divergencia em `scope: "catalog"`.

## Cenario 3: Criar categoria pelo fluxo atual

Passos:

- Criar uma categoria de despesa.
- Nome: Pets teste shadow.
- Cor: qualquer cor valida.
- Limite mensal: 100.
- Consultar diagnosticos.

Esperado:

- Categoria aparece na lista atual.
- App continua funcional.
- Se houver divergencia, ela deve indicar diferenca entre catalogo legado e snapshot novo.

## Cenario 4: Criar etiqueta pelo fluxo atual

Passos:

- Criar uma etiqueta de despesa.
- Categoria principal: categoria criada ou Alimentacao.
- Nome: Restaurante teste shadow.
- Consultar diagnosticos.

Esperado:

- Etiqueta aparece na lista atual.
- Shadow nao bloqueia o fluxo.
- Divergencias, se existirem, ficam registradas para analise.

## Cenario 5: Editar categoria ou etiqueta

Passos:

- Editar nome/cor de uma categoria.
- Editar nome/cor de uma etiqueta.
- Consultar diagnosticos.

Esperado:

- Alteracoes aparecem na UI atual.
- App nao perde lancamentos antigos.
- Shadow mode nao bloqueia salvamento.

## Cenario 6: Remover/arquivar categoria ou etiqueta

Passos:

- Remover uma etiqueta criada para teste.
- Remover uma categoria criada para teste, se a UI permitir.
- Consultar diagnosticos.

Esperado:

- Item deixa de aparecer na organizacao atual.
- Lancamentos antigos continuam visiveis.
- Divergencia relevante deve ser documentada antes de substituir o fluxo.

## Desativar catalogShadow

No console:

```js
localStorage.removeItem("finance-flow:catalogShadow")
location.reload()
```

## Criterio para avancar

Podemos conectar os casos de uso novos na tela de Ajustes somente quando:

- app carregar sem erro com `catalogShadow` ativo;
- divergencias forem nulas ou documentadas;
- criacao, edicao e remocao atuais continuarem funcionando;
- nenhuma divergencia indicar risco de perda de categoria, etiqueta ou lancamento antigo.

## Registro de resultado

| Data | Ambiente | Cenario | Resultado | Divergencias | Decisao |
| --- | --- | --- | --- | --- | --- |
|  |  | Carregamento inicial |  |  |  |
|  |  | Categoria existente |  |  |  |
|  |  | Criar categoria |  |  |  |
|  |  | Criar etiqueta |  |  |  |
|  |  | Editar categoria/etiqueta |  |  |  |
|  |  | Remover/arquivar |  |  |  |
