Execute o workflow completo de desenvolvimento usando os subagents do projeto.

## Fluxo obrigatório

1. Acione `requirements-analyst` para levantar requisitos e criar a especificação SDD.
2. Acione `software-engineer-planner` para planejar o sistema e definir pontos de TDD.
3. Acione `software-architect` para definir arquitetura com NestJS, Next.js e Supabase.
4. Acione `database-architect-dba` para modelar o banco e políticas RLS.
5. Acione `backend-implementation-senior` para implementar backend com SOLID, Clean Code e TDD quando necessário.
6. Acione `backend-code-reviewer` para revisar backend, SOLID, Clean Code e testes.
7. Acione `frontend-implementation-senior` para implementar frontend com componentes reutilizáveis.
8. Acione `frontend-code-reviewer` para revisar frontend, componentização, UX e testes.
9. Acione `qa-test-engineer` para criar plano, casos de teste e validar critérios de aceite.

## Regras

Antes de implementar código, apresente um plano resumido e aguarde aprovação do usuário, exceto se o usuário pedir explicitamente para implementar direto.

## Critérios obrigatórios

Durante o workflow, validar:

- SDD antes da implementação.
- SOLID na implementação.
- Clean Code.
- Reutilização real de componentes, services, hooks e funções.
- TDD em regras críticas.
- Testes mínimos para fluxos sensíveis.
- Revisão backend e frontend antes do QA.
- QA validando critérios de aceite.

## Entrega final obrigatória

Ao final, entregue:

- Resumo do que foi feito
- Arquivos alterados
- Como testar
- Testes criados/executados/sugeridos
- Pendências
- Riscos
- Checklist de aceite
