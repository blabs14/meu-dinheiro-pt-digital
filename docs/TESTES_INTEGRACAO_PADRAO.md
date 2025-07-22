# Padrão de Testes de Integração Robustos

## 1. Injeção de Dependências
- Todos os services (ex: `makeGoalService`, `makeTransactionService`) aceitam o cliente supabase como argumento.
- Routers (ex: `createGoalsRoutes`, `createTransactionsRoutes`) aceitam o service e o middleware JWT como argumentos.
- O app de teste é criado com `createApp({ authRoutes })` e os routers são montados explicitamente.
- O middleware JWT é sempre injetado, nunca importado diretamente.

## 2. Mock Persistente
- O mock do supabase (`supabaseMock`) mantém arrays para cada tabela (ex: `familiesDb`, `goalsDb`, `transactionsDb`).
- Métodos `.insert`, `.select`, `.update`, `.delete` simulam o comportamento real do Supabase, incluindo chainability.
- O mock permite simular relações (ex: family_members) e lógica de negócio (validação, erros, etc.).

## 3. Estrutura dos Testes
- Usar `supertest` para fazer requests ao app isolado.
- Autenticação é mockada com um router mínimo (`/auth/signup`, `/auth/login`).
- Tokens válidos/inválidos são controlados pelo mock.
- Cada teste pode criar utilizadores, dados e verificar respostas e status codes.

## 4. Replicar para Novos Módulos
- Criar o service com injeção de dependências.
- Criar o router como função que aceita o service e JWT.
- Adicionar endpoints mínimos (listagem, detalhe, criação, update, delete).
- Expandir o mock para a nova tabela.
- Escrever testes de integração cobrindo autenticação, validação, edge cases.

## 5. Boas Práticas e Dicas
- Garantir que todos os handlers usam `asyncHandler` para propagação de erros.
- Usar sempre `{ success, data }` ou `{ success: false, error }` nas respostas.
- Limpar logs temporários antes de commitar.
- Se um teste falhar, verificar o mock e a ordem dos middlewares.

## 6. Exemplo Mínimo de Setup
```js
// Exemplo de setup de teste de integração
import { createApp } from '...';
import { makeMyService } from '...';
import { createMyRoutes } from '...';
import { makeJwtAuth } from '...';
import { supabaseMock } from '...';
import { Router } from 'express';

const myService = makeMyService(supabaseMock);
const jwtAuth = makeJwtAuth(supabaseMock);
const myRouter = createMyRoutes(myService, jwtAuth);
const mockAuthRouter = Router();
mockAuthRouter.post('/signup', ...);
mockAuthRouter.post('/login', ...);
const app = createApp({ authRoutes: mockAuthRouter });
app.use('/myroute', myRouter);
// ...
```

---

**Este padrão garante robustez, previsibilidade e facilidade de manutenção para todos os testes de integração do projeto.** 