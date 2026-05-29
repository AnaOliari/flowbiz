# Plano de Testes — Tela de Oportunidades

**Feature:** CRUD de Oportunidades + Visualização Kanban  
**Rota:** `/oportunidades`  
**Data:** 2026-05-29  
**Responsável:** QA Engineer  
**Status:** Aguardando execução

---

## 1. Pré-condições

Antes de iniciar qualquer caso de teste, garantir:

1. **Backend rodando** em `http://localhost:3000` (NestJS).
2. **Frontend rodando** em `http://localhost:3001` (Next.js).
3. **Banco de dados** PostgreSQL acessível via Prisma com migrations aplicadas.
4. **Usuário de teste criado** via `POST /auth/register` e autenticado — cookie `accessToken` (HttpOnly) presente na sessão do navegador.
5. **Pelo menos 1 cliente cadastrado** via `POST /clients` (necessário para popular o dropdown do formulário).
6. **Pelo menos 3 oportunidades cadastradas** com status diferentes (OPEN, WON, LOST) para validar agrupamento no Kanban e listagem na tabela.
7. Navegador com DevTools disponível para inspeção de requisições de rede.

### Dados de apoio sugeridos

```
Usuário de teste:
  email: qa@flowbiz.test
  password: Senha@123

Clientes:
  - { name: "Empresa Alpha", email: "alpha@test.com" }
  - { name: "Empresa Beta", email: "beta@test.com" }

Oportunidades:
  - { title: "Oportunidade OPEN",  value: 5000,   status: "OPEN",  clientId: <id-alpha> }
  - { title: "Oportunidade WON",   value: 12000,  status: "WON",   clientId: <id-beta> }
  - { title: "Oportunidade LOST",  value: 3000,   status: "LOST",  clientId: <id-alpha>, expectedCloseDate: "2026-06-30" }
```

---

## 2. Casos de Teste

### Listagem

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT01  | Listar oportunidades autenticado | Usuário logado, 3 oportunidades cadastradas | 1. Acessar `/oportunidades` | Tabela exibe as 3 oportunidades com colunas: Título, Cliente, Valor (R$), Status (badge), Data Prevista, Ações. |
| CT02  | Acesso sem autenticação | Sem cookie `accessToken` | 1. Limpar cookies do navegador. 2. Acessar `/oportunidades` diretamente. | Redirecionado para tela de login ou exibida mensagem de erro de autenticação. Nenhuma oportunidade exposta. |
| CT03  | Estado vazio (sem oportunidades) | Usuário logado, nenhuma oportunidade cadastrada | 1. Deletar todas as oportunidades via API. 2. Acessar `/oportunidades`. | Tabela exibe mensagem "Nenhuma oportunidade cadastrada." e dica "Clique em 'Nova oportunidade' para começar." |
| CT04  | Estado de loading | Usuário logado | 1. Throttle de rede para "Slow 3G" no DevTools. 2. Acessar `/oportunidades`. | Exibido texto "Carregando..." enquanto a requisição está pendente. Tabela só aparece após resposta da API. |
| CT05  | Erro de API na listagem | Usuário logado, backend inacessível | 1. Derrubar o backend. 2. Acessar `/oportunidades`. | Exibida mensagem de erro em fundo vermelho ("Não foi possível conectar ao servidor" ou mensagem da API). Nenhum dado parcial exibido. |

---

### Criar Oportunidade

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT06  | Criar oportunidade com todos os campos | Usuário logado, 1+ cliente cadastrado | 1. Clicar em "+ Nova oportunidade". 2. Preencher: Título "Negócio Completo", Descrição "Teste", Valor 9999.99, Status "WON", Data "2026-07-15", Cliente "Empresa Alpha". 3. Clicar em "Criar oportunidade". | Modal fecha. Toast "Oportunidade criada com sucesso" exibido. Oportunidade aparece na tabela sem recarregar a página. |
| CT07  | Criar oportunidade apenas com campos obrigatórios | Usuário logado, 1+ cliente cadastrado | 1. Abrir modal. 2. Preencher: Título "Apenas Obrigatórios", Valor 100, Cliente "Empresa Alpha". 3. Deixar Descrição e Data em branco. Status padrão "Em aberto". 4. Clicar em "Criar oportunidade". | Oportunidade criada com sucesso. Coluna "Data Prevista" exibe "—". Status badge exibe "Em aberto" (azul). |
| CT08  | Tentar criar sem título | Usuário logado | 1. Abrir modal. 2. Preencher Valor e Cliente. 3. Deixar Título vazio. 4. Clicar em "Criar oportunidade". | Navegador bloqueia o submit (HTML5 `required`). Modal não fecha. Nenhuma requisição enviada ao backend. |
| CT09  | Tentar criar sem clientId | Usuário logado | 1. Abrir modal. 2. Preencher Título e Valor. 3. Não selecionar nenhum cliente (opção "Selecione um cliente" ativa). 4. Clicar em "Criar oportunidade". | Navegador bloqueia o submit (HTML5 `required` no select). Modal não fecha. Nenhuma requisição enviada. |
| CT10  | Tentar criar com value = 0 | Usuário logado | 1. Abrir modal. 2. Preencher Título e Cliente. 3. Digitar "0" no campo Valor (contornar o `min="0.01"` via DevTools ou digitação direta). 4. Tentar submeter. | Navegador bloqueia o submit via validação HTML5 (`min="0.01"`). Se contornado via API direta: backend retorna erro de validação. |
| CT11  | Criar com clientId inválido (UUID malformado) | Usuário logado | 1. Interceptar a requisição POST via DevTools e alterar `clientId` para "id-invalido". | Route Handler repassa ao backend. Backend retorna 400 ou 422. Toast de erro exibido. Modal permanece aberto. |
| CT12  | Criar com clientId de cliente inexistente | Usuário logado | 1. Interceptar a requisição POST e substituir `clientId` por um UUID válido mas inexistente no banco. | Backend retorna 404. Route Handler repassa o status. Toast de erro exibido. Modal permanece aberto. |

---

### Editar Oportunidade

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT13  | Verificar campos pré-populados ao abrir edição | Oportunidade "LOST" com data "2026-06-30" cadastrada | 1. Clicar em "Editar" na linha da oportunidade "LOST". | Modal abre com título "Editar oportunidade". Todos os campos refletem os valores atuais: título, descrição, valor, status "Perdido", data "2026-06-30", cliente selecionado corretamente. |
| CT14  | Verificar data sem off-by-one (fuso horário) | Oportunidade com `expectedCloseDate: "2026-06-30"` | 1. Clicar em "Editar" na oportunidade com data 2026-06-30. 2. Verificar campo de data no modal. 3. Verificar coluna "Data Prevista" na tabela. | Campo date no modal exibe "2026-06-30". Coluna na tabela exibe "30/06/2026" (sem regredir para 29/06). Confirmar que `dateFormatter` com `timeZone: 'UTC'` está funcionando. |
| CT15  | Editar apenas um campo (alteração parcial) | Oportunidade "OPEN" cadastrada | 1. Clicar em "Editar". 2. Alterar apenas o valor para 99999. 3. Clicar em "Salvar alterações". | Requisição PATCH enviada com todos os campos do form (não só o alterado). Oportunidade atualizada na tabela. Toast de sucesso. Estado `editingOpportunity` limpo (modal não reabre com dados antigos). |
| CT16  | Alterar status de OPEN para WON | Oportunidade com status OPEN | 1. Clicar em "Editar". 2. Alterar status para "Ganho". 3. Salvar. | Badge na tabela muda para verde "Ganho". Kanban: card some da coluna "Em Aberto" e aparece em "Ganho" ao alternar view. |
| CT17  | Tentar editar oportunidade com ID inexistente | — | 1. Interceptar a requisição PATCH e alterar o ID para um UUID inexistente. | Backend retorna 404. Toast de erro exibido. Modal permanece aberto. Lista não é alterada. |
| CT18  | Tentar editar sem autenticação | — | 1. Expirar/remover o cookie `accessToken`. 2. Tentar salvar edição. | Route Handler recebe token vazio, backend retorna 401. Toast de erro exibido. Usuário pode ser redirecionado para login dependendo do middleware. |

---

### Excluir Oportunidade

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT19  | Excluir oportunidade confirmando | Oportunidade cadastrada | 1. Clicar em "Excluir" na linha da oportunidade. 2. Verificar que o nome da oportunidade aparece no texto do dialog. 3. Clicar em "Excluir" no DeleteDialog. | Dialog fecha. Toast "Oportunidade excluída com sucesso". Oportunidade removida da tabela sem reload. |
| CT20  | Cancelar exclusão pelo botão | Oportunidade cadastrada | 1. Clicar em "Excluir". 2. Clicar em "Cancelar" no dialog. | Dialog fecha. Oportunidade permanece na lista. Nenhuma requisição DELETE enviada. |
| CT21  | Cancelar exclusão pelo Escape ou backdrop | Oportunidade cadastrada | 1. Clicar em "Excluir". 2. Pressionar tecla Escape (ou clicar fora do dialog). | Dialog fecha via listener de teclado. Oportunidade não é excluída. |
| CT22  | Tentar excluir ID inexistente | — | 1. Interceptar a requisição DELETE e alterar o ID para um UUID inexistente. | Backend retorna 404. `res.ok` é false e `res.status !== 204`, então Toast de erro é exibido. Dialog pode permanecer aberto (verificar comportamento). |
| CT22b | Tentar excluir sem autenticação | — | 1. Remover o cookie `accessToken`. 2. Tentar confirmar exclusão. | Backend retorna 401. Toast de erro. Oportunidade não removida da lista. |

---

### Visualizacao Kanban

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT23  | Alternar entre Tabela e Kanban | 3 oportunidades cadastradas (OPEN, WON, LOST) | 1. Na view Tabela (padrão), clicar em "Kanban". 2. Verificar layout. 3. Clicar em "Tabela" para voltar. | Botão "Kanban" fica com fundo escuro (ativo). Layout muda para 3 colunas. Ao voltar, botão "Tabela" fica ativo e tabela é exibida. Dados permanecem os mesmos (nenhuma nova chamada à API). |
| CT24  | Agrupamento correto por status no Kanban | Oportunidades com OPEN, WON e LOST | 1. Alternar para view Kanban. | Coluna "Em Aberto" contém apenas oportunidades OPEN. Coluna "Ganho" contém apenas WON. Coluna "Perdido" contém apenas LOST. Contador de cada coluna reflete a quantidade correta. |
| CT25  | Cards do Kanban com dados corretos | Oportunidades cadastradas | 1. Alternar para view Kanban. 2. Inspecionar cada card. | Cada card exibe: título da oportunidade, nome do cliente e valor formatado em R$ (ex: "R$ 5.000,00"). |
| CT26  | Coluna vazia no Kanban | Nenhuma oportunidade com status WON | 1. Garantir que não há oportunidades WON. 2. Abrir view Kanban. | Coluna "Ganho" exibe mensagem "Nenhuma oportunidade" centralizada. Contador da coluna exibe "0". Outras colunas com dados funcionam normalmente. |

---

### Toast Notifications

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT27  | Toast de sucesso ao criar | Usuário logado | 1. Criar uma oportunidade válida. | Toast verde/sucesso com texto "Oportunidade criada com sucesso" aparece. Desaparece automaticamente após o timeout configurado. |
| CT28  | Toast de sucesso ao editar | Oportunidade existente | 1. Editar e salvar uma oportunidade. | Toast verde/sucesso com texto "Oportunidade atualizada com sucesso". Verificar também que `editingOpportunity` foi limpo (modal não guarda estado antigo). |
| CT29  | Toast de sucesso ao excluir | Oportunidade existente | 1. Confirmar exclusão de uma oportunidade. | Toast verde/sucesso com texto "Oportunidade excluída com sucesso". |
| CT29b | Toast de erro em falha de API | Backend retornando erro | 1. Simular erro do backend (ex: derrubar serviço). 2. Tentar criar uma oportunidade. | Toast vermelho/erro com mensagem de erro da API ou "Não foi possível conectar ao servidor". |

---

### Regressao — Tela de Clientes

| ID    | Cenário | Pré-condição | Passos | Resultado Esperado |
|-------|---------|--------------|--------|--------------------|
| CT30  | DeleteDialog funciona normalmente em /clientes | 1+ cliente cadastrado | 1. Acessar `/clientes`. 2. Clicar em "Excluir" em um cliente. 3. Confirmar exclusão. | Dialog compartilhado (`delete-dialog.tsx`) funciona sem regressão. Cliente excluído. Toast de sucesso. Nenhum erro no console. |
| CT31  | DeleteDialog cancela corretamente em /clientes | 1+ cliente cadastrado | 1. Acessar `/clientes`. 2. Clicar em "Excluir". 3. Pressionar Escape. | Dialog fecha. Cliente não excluído. Sem erros no console. Confirma que o componente compartilhado não foi quebrado pelas mudanças da tela de oportunidades. |

---

## 3. Criterios de Aceite

Para que a feature seja considerada **aprovada**, todos os itens abaixo devem ser atendidos:

- [ ] **CA01** — A listagem de oportunidades é exibida corretamente para usuários autenticados.
- [ ] **CA02** — Usuários não autenticados não conseguem acessar dados de oportunidades.
- [ ] **CA03** — O formulário de criação valida os campos obrigatórios (title, value, clientId) antes de submeter.
- [ ] **CA04** — Oportunidades criadas aparecem imediatamente na lista sem reload da página.
- [ ] **CA05** — O modal de edição pré-popula todos os campos corretamente, incluindo a data sem off-by-one.
- [ ] **CA06** — Após editar, o estado `editingOpportunity` é limpo (`null`) para que o próximo clique em "+ Nova oportunidade" abra o modal em modo criação.
- [ ] **CA07** — A exclusão remove a oportunidade da lista localmente, sem nova chamada de listagem à API.
- [ ] **CA08** — O DeleteDialog exibe o nome da oportunidade no texto de confirmação.
- [ ] **CA09** — A alternância entre Tabela e Kanban não dispara nova chamada à API.
- [ ] **CA10** — O Kanban agrupa as oportunidades pelas três colunas corretas (OPEN, WON, LOST).
- [ ] **CA11** — Colunas vazias no Kanban exibem mensagem "Nenhuma oportunidade" com contador "0".
- [ ] **CA12** — Badges de status exibem as cores corretas: azul (OPEN), verde (WON), vermelho (LOST).
- [ ] **CA13** — O dropdown de clientes é carregado da API apenas quando o modal é aberto.
- [ ] **CA14** — Valores monetários são formatados no padrão pt-BR (ex: R$ 1.000,00).
- [ ] **CA15** — Toasts de sucesso e erro são exibidos para todas as ações (criar, editar, excluir).
- [ ] **CA16** — A tela de Clientes (`/clientes`) não sofreu regressão no DeleteDialog compartilhado.
- [ ] **CA17** — O campo `responsibleUserId` nunca é enviado no body do formulário; vem do JWT no backend.
- [ ] **CA18** — Erros do backend são propagados como toast e não travam a tela.

---

## 4. Riscos e Melhorias Futuras

### Riscos conhecidos

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| `BACKEND_URL` hardcoded | Alta | `http://localhost:3000` está hardcoded em `app/api/opportunities/route.ts` e `app/api/opportunities/[id]/route.ts`. Em ambiente de staging/produção a URL será diferente e a aplicação falhará silenciosamente. Deve ser movido para variável de ambiente (`BACKEND_URL` ou `NEXT_PUBLIC_BACKEND_URL` via `.env`). |
| Token ausente não redireciona | Alta | Quando `accessToken` está vazio, o Route Handler envia `Authorization: Bearer ` (string vazia) ao backend. O backend retorna 401, mas o frontend apenas exibe toast de erro — não há redirecionamento automático para o login. O middleware de autenticação do Next.js deve tratar isso. |
| Sem feedback de erro ao carregar clientes no modal | Media | Em `opportunity-modal.tsx`, se `GET /api/clients` falhar, o array é definido como `[]` silenciosamente (`catch(() => setClients([]))`). O dropdown fica com apenas "Selecione um cliente" e sem aviso ao usuário. |
| Botão "Salvar" não desabilitado sem clientes | Media | Se a lista de clientes retornar vazia (erro de API), o select fica com `value=""` e o botão de submit pode ser acionado, resultando em erro de validação HTML5. Porém o select tem `required`, então o browser bloqueia — risco baixo mas deve ser documentado. |
| Kanban sem acao de editar/excluir | Media | A view Kanban exibe os cards mas não disponibiliza botões de "Editar" ou "Excluir". O usuário precisa alternar para a Tabela para realizar essas ações. Isso é um gap de UX, não necessariamente um bug, mas deve ser validado com o Product Owner se é comportamento aceito. |
| Race condition em ações concorrentes | Baixa | `actionLoading` é compartilhado entre criar, editar e excluir na mesma página. Se dois modais/dialogs fossem abertos simultaneamente (o que a UI não permite, mas é um risco latente), o estado poderia ser sobrescrito incorretamente. |
| Sem paginação na listagem | Baixa | `GET /opportunities` retorna todos os registros sem paginação. Com grande volume de dados a performance da tabela e do kanban degradará. |

### Melhorias sugeridas

- **Drag-and-drop no Kanban:** Permitir mover cards entre colunas arrastando, disparando `PATCH` de status automaticamente.
- **Filtros por status na tabela:** Botões de filtro rápido por OPEN/WON/LOST acima da tabela.
- **Ordenação de colunas:** Clicar no cabeçalho da tabela para ordenar por Valor, Data, Status.
- **Busca por título:** Campo de busca para filtrar oportunidades pelo título sem ir ao servidor.
- **Confirmar fechar modal com dados preenchidos:** Exibir aviso ao clicar no backdrop/X com o formulário preenchido.
- **Ações no Kanban:** Adicionar menu de ações (editar/excluir) diretamente nos cards do Kanban.
- **Variável de ambiente para `BACKEND_URL`:** Mover para `.env.local` e `.env.example` para facilitar deploys.
- **Tratamento de erro visível ao carregar clientes:** Exibir mensagem no dropdown quando a API de clientes falhar.
- **Testes automatizados E2E:** Implementar fluxos críticos com Playwright (ver seção de testes automatizados sugeridos abaixo).

---

## Testes Automatizados Sugeridos

### Testes unitários (Vitest/Jest)

```typescript
// opportunity-form.test.tsx
// - Renderiza campos obrigatórios com asterisco
// - Pré-popula campos ao receber `initial` com data
// - Campo `expectedCloseDate` exibe slice(0, 10) da ISO string
// - Botão submit desabilitado quando loading=true ou loadingClients=true
// - handleSubmit envia undefined para description e expectedCloseDate quando vazios

// kanban-board.test.tsx
// - Renderiza 3 colunas sempre (OPEN, WON, LOST)
// - Agrupa oportunidades por status corretamente
// - Coluna vazia exibe "Nenhuma oportunidade"
// - Contador de cada coluna reflete quantidade real
// - Formata valor em BRL corretamente

// opportunity-table.test.tsx
// - Exibe mensagem de estado vazio quando array vazio
// - Renderiza uma linha por oportunidade
// - Badge aplica a classe correta por status
// - Data "—" quando expectedCloseDate é null
// - Data sem off-by-one para "2026-06-30" exibe "30/06/2026"
```

### Testes de integração (Route Handlers)

```typescript
// Mockar `cookies()` do next/headers e `fetch` global
// GET /api/opportunities — repassa Authorization header e retorna body
// POST /api/opportunities — envia body + Authorization, retorna 201
// PATCH /api/opportunities/[id] — envia body + Authorization, retorna 200
// DELETE /api/opportunities/[id] — retorna 204 sem body quando backend retorna 204
// DELETE /api/opportunities/[id] — retorna JSON de erro quando backend retorna 404
```

### Testes E2E (Playwright)

```typescript
// Fluxo completo: login -> criar oportunidade -> verificar na tabela
// Fluxo editar: clicar Editar -> alterar valor -> salvar -> verificar na tabela
// Fluxo excluir: clicar Excluir -> confirmar -> verificar remoção
// Kanban: alternar view -> verificar 3 colunas -> verificar cards
// Regressão Clientes: excluir cliente -> DeleteDialog funciona
```
