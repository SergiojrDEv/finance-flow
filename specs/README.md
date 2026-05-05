# Finance Flow SDD

Esta pasta e a fonte da verdade para evoluir o Finance Flow com Spec-Driven Development.

No SDD, cada mudanca relevante nasce como especificacao antes de virar codigo. A ordem esperada e:

1. Especificar a intencao, regras e criterios de aceite.
2. Validar impacto em dados, seguranca e experiencia do usuario.
3. Implementar em branch separada.
4. Testar contra a especificacao.
5. So entao integrar ao app estavel.

## Estrutura

- `00-product-context.md`: contexto do produto e publico.
- `01-architecture-principles.md`: regras arquiteturais que protegem o projeto.
- `domains/`: especificacoes por area de negocio.
- `adr/`: decisoes arquiteturais versionadas.
- `templates/`: modelos para novas especificacoes.
- `traceability.md`: matriz que liga specs, codigo e validacao.

## Regra de ouro

O app estavel nao deve depender de uma camada nova ate que a especificacao, os testes e o modo de compatibilidade estejam claros.
