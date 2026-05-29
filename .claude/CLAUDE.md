# Instruções do Projeto para Claude Code

Este projeto utiliza um workflow com subagents especializados para desenvolvimento de software.

## Stack base

- Backend: NestJS
- Frontend: Next.js
- Banco de dados: Supabase/PostgreSQL
- Storage: Supabase Storage
- Autenticação: Supabase Auth ou JWT próprio, conforme decisão arquitetural
- Linguagem principal: TypeScript

## Workflow obrigatório para features completas

Sempre que o usuário pedir para criar uma feature completa, seguir este fluxo:

1. Usar o agente `requirements-analyst`
2. Usar o agente `software-engineer-planner`
3. Usar o agente `software-architect`
4. Usar o agente `database-architect-dba`
5. Usar o agente `backend-implementation-senior`
6. Usar o agente `backend-code-reviewer`
7. Usar o agente `frontend-implementation-senior`
8. Usar o agente `frontend-code-reviewer`
9. Usar o agente `qa-test-engineer`

## Camadas do workflow

### Planejamento

- `requirements-analyst`
- `software-engineer-planner`
- `software-architect`
- `database-architect-dba`

### Implementação

- `backend-implementation-senior`
- `frontend-implementation-senior`

### Validação

- `backend-code-reviewer`
- `frontend-code-reviewer`
- `qa-test-engineer`

## SDD - Spec-Driven Development

Antes de implementar qualquer feature relevante:

1. Criar especificação da funcionalidade.
2. Definir requisitos funcionais.
3. Definir requisitos não funcionais.
4. Definir regras de negócio.
5. Definir contratos de API.
6. Definir modelo de dados.
7. Definir critérios de aceite.
8. Somente depois iniciar a implementação.

## Princípios obrigatórios de engenharia

Sempre aplicar:

- SOLID
- Clean Code
- DRY
- KISS
- YAGNI
- Separação de responsabilidades
- Baixo acoplamento
- Alta coesão
- Código testável
- Segurança por padrão
- Componentes, serviços e funções reutilizáveis quando houver reutilização real

## TDD

Use TDD quando:

- O usuário solicitar explicitamente.
- A regra de negócio for crítica.
- Houver cálculo, permissão, validação ou fluxo sensível.
- A feature tiver alto risco de regressão.
- O planejamento técnico indicar TDD obrigatório.

Quando usar TDD:

1. Criar teste primeiro.
2. Confirmar que o teste falha, quando possível.
3. Implementar o mínimo necessário.
4. Fazer o teste passar.
5. Refatorar mantendo os testes passando.

## Regras de segurança

Nunca executar comandos destrutivos sem autorização explícita.

Comandos proibidos sem autorização:

- `rm -rf`
- `git reset --hard`
- `git clean -fd`
- `docker system prune`
- `drop database`
- `truncate table`
- `delete` sem `where`

## Idioma

Responder sempre em português brasileiro, salvo quando o usuário pedir explicitamente outro idioma.

## Padrões de desenvolvimento

- Código limpo
- TypeScript tipado
- Separação de responsabilidades
- Testes quando aplicável
- Revisão obrigatória antes de considerar uma tarefa concluída
- Evitar overengineering
- Priorizar simplicidade e manutenção

## Padrão de entrega final

Ao finalizar uma tarefa, entregar:

1. Resumo do que foi feito
2. Arquivos alterados
3. Como testar
4. Testes executados ou sugeridos
5. Pendências
6. Riscos
7. Checklist de aceite
