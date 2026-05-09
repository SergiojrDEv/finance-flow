# Spec: Carteira App Foundation

Status: em andamento

## Objetivo

Criar a base visual de uma experiencia mais parecida com aplicativo financeiro, inspirada no pacote Open Finance recebido, sem conectar provider real, sem alterar banco e sem mexer em autenticacao.

## Principios

- A tela deve parecer uma carteira financeira, nao uma pagina tecnica.
- Contas, cartoes e investimentos devem ser apresentados como blocos claros e acionaveis.
- A fase inicial usa dados estaticos/locais para validar UX antes de qualquer integracao Open Finance.
- A fase seguinte usa mock funcional derivado dos dados locais para validar comportamento antes de conectar banco real.
- O visual deve reaproveitar tokens do design system atual.

## Criterios de aceite

- A navegacao deve ter uma secao `Carteira`.
- A tela deve exibir um card principal de patrimonio/saldo conectado.
- A tela deve exibir cards de contas, cartao e investimento em estilo app.
- A tela deve ter uma area de revisao/pendencias inspirada em transacoes importadas.
- Os saldos devem refletir dados locais do mes selecionado quando existirem.
- O dominio Open Finance deve existir em paralelo com conexoes bancarias e transacoes importadas.
- Os casos de uso devem conectar provider mock, importar transacoes e revisar pendencias sem acessar Supabase.
- A tela deve permitir conectar/desconectar banco mock local com modal de instituicoes.
- A tela deve permitir marcar transacoes importadas como conferidas em modo local.
- A tela deve permitir criar um lancamento local a partir de uma transacao importada mock.
- O historico de lancamentos deve diferenciar visualmente origem Manual e Banco.
- O estado vazio deve educar o usuario antes de pedir uma conexao.
- Mobile deve manter leitura compacta e app-like.
- Build e testes devem continuar passando.

## Fora de escopo neste corte

- Criar tabelas Open Finance no Supabase.
- Conectar Pluggy, Belvo ou qualquer provider real.
- Importar automaticamente transacoes bancarias.
- Alterar login, sync ou regras financeiras existentes.
