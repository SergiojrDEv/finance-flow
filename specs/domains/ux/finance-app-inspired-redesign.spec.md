# Spec: Redesign inspirado em app financeiro

Status: em evolucao

## Objetivo

Aplicar uma linguagem visual mais proxima de aplicativos financeiros mobile, usando referencias de UI kits de financas como inspiracao, sem perder a identidade do Finance Flow.

## Principios

- Preservar azul escuro, amarelo da marca e cards limpos.
- Priorizar leitura de app no mobile.
- Reduzir sensacao de dashboard tecnico no primeiro contato.
- Manter login, Supabase, banco e regras financeiras fora do escopo.

## Criterios de aceite

- A visao geral deve ter um card principal de disponibilidade financeira.
- A home deve oferecer atalhos rapidos para receita, despesa, investimento e metas.
- Atalhos rapidos de receita, despesa e investimento devem abrir o lancamento no tipo correto.
- Cards de resumo devem ganhar icones textuais discretos e melhor hierarquia.
- Orcamentos e metas devem mostrar status/progresso em cards mais visuais, sem poluir a tela.
- O mobile deve parecer mais app e menos site responsivo.
- Build e testes devem continuar passando.

## Nova rodada app-first

Esta rodada evolui a fase anterior sem migrar o runtime para React, Angular ou outro framework. A referencia visual passa a ser usada como direcao de produto, mantendo o app atual em JavaScript modular ate que as regras estejam suficientemente isoladas.

### Fase 1 - Casca de app segura

- Home mais compacta, com hero de carteira e cards de resumo menos pesados.
- Atalhos de acao com leitura de app, sem duplicar fluxos.
- Navegacao mobile com o lancamento como acao principal.
- Barra inferior mobile reduzida para os cinco caminhos principais.
- Limites e historico saem da barra principal no mobile e ficam como atalhos complementares da home.
- Nenhuma alteracao em autenticacao, Supabase, sync, schema ou regras financeiras.

### Fase 2 - Telas por intencao

- Receita deve ter formulario simples e sem campos de pagamento, vencimento ou recorrencia.
- Despesa deve concentrar pagamento, vencimento, parcelamento e recorrencia.
- Investimento deve focar aporte, destino, meta e origem.
- Metas devem parecer acompanhamento de objetivo, nao lancamento comum.
- Cada tipo de lancamento deve ter um resumo visual proprio do fluxo que esta sendo preenchido.
- A tela de metas deve ter chamada propria de planejamento e atalho para lancar aporte.

### Fase 3 - Leitura didatica para usuario leigo

- Incluir estados vazios e textos curtos que expliquem o proximo passo.
- Reduzir paineis repetitivos e mostrar detalhes sob demanda.
- Priorizar linguagem de aplicativo no mobile.
- Estados vazios principais devem ter uma acao clara, como criar lancamento, criar categoria, criar meta ou adicionar conta.
- Textos de carteira, limites, metas e historico devem explicar o papel da tela em uma frase curta.

### Fase 4 - Preparacao para framework futuro

- Manter dominio, casos de uso, mapeadores e testes independentes da UI.
- Evitar conectar a nova arquitetura no bootstrap ou auth antes da hora.
- Permitir migracao futura para React, Angular ou app nativo sem reescrever regra financeira.
- Navegacao e contrato de rotas devem existir como modelo puro, sem DOM, para serem reutilizados por qualquer framework futuro.
- O runtime atual pode consumir esse modelo, desde que a aplicacao continue sem tocar em autenticacao, Supabase ou schema.

### Fase 5 - Contratos de tela reutilizaveis

- Cada rota principal deve possuir um contrato de tela com titulo, contexto, descricao e acoes.
- O contrato deve separar intencoes de tela, como lancar, revisar historico, ajustar categorias ou conectar banco.
- Um shell model deve combinar navegacao e tela ativa sem depender de DOM, framework, Supabase ou estado global.

### Fase 6 - Contratos refletidos no runtime atual

- O topo do app atual deve ler contexto, titulo e descricao do contrato de tela ativo.
- A acao principal e a primeira acao secundaria devem vir do contrato de tela quando fizer sentido.
- Acoes por intencao, como lancar movimento, lancar aporte e ver mes, devem ter comportamento centralizado.
- Deve existir uma view serializavel do shell para consumo futuro por React, Angular ou app nativo.

### Fase 7 - Melhorias visuais perceptiveis

- A home deve ganhar leitura mais proxima de aplicativo financeiro, com explicacao compacta da disponibilidade.
- A carteira deve orientar o usuario em passos simples para contas, revisao e lancamentos.
- Lancamentos do mes devem ter leitura de extrato em cartoes no mobile, sem perder a tabela no desktop.
- As melhorias devem continuar limitadas a UX/visual, sem alterar auth, Supabase, schema ou sync.

### Fase 8 - Visao geral mais consultiva

- A distribuicao por categoria deve parecer um card de app financeiro, nao apenas uma lista tecnica.
- O usuario deve entender rapidamente onde o dinheiro foi no mes selecionado.
- O painel de categorias deve exibir o periodo em leitura compacta.
- A mudanca deve continuar limitada a dashboard/UX, sem alterar auth, Supabase, schema ou sync.

### Fase 9 - Planejamento menos poluido

- Orcamentos devem mostrar consumo e status primeiro, deixando edicao de limites sob demanda.
- Metas devem mostrar rapidamente quanto falta para concluir o objetivo.
- A experiencia deve ficar mais proxima de app de planejamento, sem remover controles existentes.
- A mudanca deve continuar limitada a templates e estilos, sem alterar auth, Supabase, schema ou sync.

### Fase 10 - Historico como linha do tempo

- O historico diario deve parecer uma linha do tempo de movimentos, nao uma lista tecnica.
- Receita, despesa e investimento devem ter marcadores visuais e rotulos simples.
- A leitura deve continuar compacta no mobile e detalhada o bastante no desktop.
- A mudanca deve continuar limitada a templates e estilos, sem alterar auth, Supabase, schema ou sync.

### Fase 11 - Home alinhada ao prototipo mobile

- A visao geral do web deve absorver a linguagem do prototipo Expo sem migrar o runtime.
- O card principal deve reunir saldo disponivel, receitas, despesas e investimentos como resumo imediato.
- A alteracao deve preparar a futura trilha React Native/Expo sem substituir o app Cloudflare atual.
- A mudanca deve continuar limitada a HTML, dashboard e estilos, sem alterar auth, Supabase, schema ou sync.

### Fase 12 - Atalhos como acoes de app

- Os atalhos da home devem parecer acoes imediatas, nao cards genericos repetidos.
- Cada atalho deve ter indicador visual por tipo para receita, despesa, investimento e meta.
- No mobile, a leitura deve continuar compacta e com affordance clara de toque.
- A mudanca deve continuar limitada a estilos e testes, sem alterar auth, Supabase, schema ou sync.

### Fase 13 - Lancamento como fluxo guiado

- O formulario de lancamento deve comunicar uma sequencia simples de uso.
- A interface deve mostrar etapas curtas para tipo, detalhes e revisao sem criar uma nova regra de negocio.
- A leitura mobile deve ficar empilhada e tocavel, mantendo todos os campos atuais.
- A mudanca deve continuar limitada a HTML, estilos e testes, sem alterar auth, Supabase, schema ou sync.

### Fase 14 - Extrato mensal mais app-like

- Lancamentos do mes devem ser apresentados como extrato do periodo, nao apenas uma tabela operacional.
- Os cards de resumo mensal devem ter marcadores visuais curtos para movimento, saldo e forma de pagamento.
- O cabecalho deve orientar que a area serve para consultar, filtrar e ajustar movimentos.
- A mudanca deve continuar limitada a HTML, templates, estilos e testes, sem alterar auth, Supabase, schema ou sync.

### Fase 15 - Metas com fluxo didatico

- A criacao de metas deve explicar o caminho basico antes do formulario.
- A tela deve reforcar a sequencia objetivo, aporte e acompanhamento do progresso.
- A melhoria deve deixar a experiencia mais acessivel para usuarios leigos sem mudar persistencia.
- A mudanca deve continuar limitada a HTML, estilos e testes, sem alterar auth, Supabase, schema ou sync.

### Trilha futura - Mobile React Native/Expo

- Iniciar somente depois de consolidar e aprovar a experiencia app-like no web atual.
- Usar `finance-flow-mobile_3` como base tecnica e visual, corrigindo encoding, assets, sync V2 e testes.
- Avisar explicitamente antes de entrar nesta trilha.

## Fora de escopo neste corte

- Alterar fluxo de autenticacao.
- Alterar schema ou sincronizacao.
- Copiar telas ou assets de terceiros.

## Evidencias

- Home com card principal de disponibilidade financeira.
- Atalhos rapidos de receita, despesa e investimento conectados ao formulario no tipo correto.
- Cards de resumo, orcamentos e metas com hierarquia visual mais proxima de app.
- Barra inferior e topo mobile preparados para leitura de aplicativo.
- Guardrails automaticos cobrindo CSS, HTML e comportamento dos atalhos.
- Iteracao app-first iniciada com casca visual mobile mais compacta e acao de lancamento destacada na barra inferior.
- Fase 1 concluida: barra inferior mobile com cinco itens principais e atalhos secundarios para limites e historico.
- Fase 2 concluida: receita, despesa e investimento ganharam resumo visual por intencao; metas ganharam hero proprio de planejamento e atalho para aporte.
- Fase 3 concluida: estados vazios principais ganharam acoes claras e textos curtos de orientacao para carteira, limites, metas e historico.
- Fase 4 concluida: contrato puro de navegacao app-first criado em application com ponte TypeScript, testes e consumo seguro pelo runtime atual.
- Fase 5 concluida: contratos puros de tela e shell app-first criados em application, preparando consumo por React, Angular ou app nativo.
- Fase 6 concluida: topo e acoes principais do runtime atual passaram a refletir o contrato de tela; shell serializavel criado para futuras UIs.
- Fase 7 concluida: home, carteira e lancamentos ganharam melhorias visuais perceptiveis, com extrato em cards no mobile e orientacao de uso mais clara.
- Fase 8 concluida: painel de categorias da visao geral ganhou leitura consultiva em card de app, chip do periodo e distribuicao visual mais clara.
- Fase 9 concluida: orcamentos passaram a editar limites sob demanda e metas ganharam leitura objetiva de quanto falta para concluir.
- Fase 10 concluida: historico diario ganhou leitura de linha do tempo com marcadores e rotulos Entrada, Saida e Aporte.
- Fase 11 concluida: hero da visao geral ganhou mini-cards de receitas, despesas e investimentos inspirados no prototipo mobile.
- Fase 12 concluida: atalhos da home ganharam indicador lateral por tipo e seta visual de acao, aproximando a home de um app sem mudar regras.
- Fase 13 concluida: formulario de lancamento ganhou regua visual de etapas para tipo, detalhes e revisao, mantendo o fluxo atual.
- Fase 14 concluida: lancamentos do mes ganharam contexto de extrato e cards de resumo com marcadores visuais.
- Fase 15 concluida: metas ganharam fluxo didatico de objetivo, aporte e acompanhamento antes do formulario.
