# Padrão de Modularização de Controllers, Hooks e Componentes

## 1. Separação de Responsabilidades
- **Controllers React**: Apenas orquestram hooks e compõem UI. Não contêm lógica de dados nem side effects diretos.
- **Hooks**: Gerem estado, side effects e feedback ao utilizador. Delegam todas as operações CRUD ao service injetado.
- **Services**: Toda a lógica de negócio, validação e interação com a API/base de dados.
- **Componentes de UI**: Apenas recebem props, não têm lógica de dados nem side effects.

## 2. Injeção de Dependências
- Hooks recebem o service como argumento (ex: `useGoalsData(userId, familyId, goalService)`).
- Services são criados via factory (ex: `makeGoalService(supabase)`).
- Facilita mocks, testes e manutenção.

## 3. Exemplo Mínimo
```tsx
// Controller
const goalService = makeGoalService(supabase);
const { goals, loading, deleteGoal } = useGoalsData(userId, familyId, goalService);
return <GoalsList goals={goals} loading={loading} onDelete={deleteGoal} />;

// Hook
export function useGoalsData(userId, familyId, goalService) { /* ... */ }

// Service
export function makeGoalService(supabase) { /* ... */ }

// Componente de UI
export function GoalsList({ goals, loading, onDelete }) { /* ... */ }
```

## 4. Dicas e Boas Práticas
- Nunca misturar lógica de dados com UI.
- Usar sempre hooks para side effects e estado.
- Componentes de UI devem ser puros e reutilizáveis.
- Tipar todas as props e dados de forma consistente.
- Facilitar testes e mocks com injeção de dependências.
- Documentar padrões e exemplos para onboarding rápido.

## 5. Como Replicar
1. Criar/ajustar o service para o domínio.
2. Criar o hook, injetando o service e gerindo apenas estado/side effects.
3. Extrair componentes de UI para listas, cards, stats, etc.
4. O controller só orquestra hooks e compõe UI.

---

**Este padrão garante escalabilidade, robustez e facilidade de manutenção para todo o frontend do projeto.** 