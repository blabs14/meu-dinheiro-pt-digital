let mockResult = { data: null, error: null };

// Estado simulado para famílias
let familiesDb = [
  {
    id: 'mock-id',
    nome: 'Família Integração',
    created_by: '11111111-1111-1111-1111-111111111111',
    description: 'Família criada por teste de integração',
  },
];
// Simular tabela de relações family_members
let familyMembersDb = [
  {
    family_id: 'mock-id',
    user_id: '11111111-1111-1111-1111-111111111111',
    role: 'owner',
  },
];
let goalsDb = [];
let transactionsDb = [];

function familiesChainable() {
  return {
    insert: (payload) => {
      const data = Array.isArray(payload) ? payload[0] : payload;
      const nomeValido = typeof data?.nome === 'string' && data.nome.length > 0;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const createdByValido = typeof data?.created_by === 'string' && uuidRegex.test(data.created_by);
      if (!nomeValido || !createdByValido) {
        return {
          select: () => Promise.resolve({ data: null, error: { message: 'Dados inválidos' } })
        };
      }
      const newFamily = { ...data, id: 'mock-id' };
      familiesDb.push(newFamily);
      // Criar relação em familyMembersDb
      if (data?.created_by) {
        familyMembersDb.push({
          family_id: newFamily.id,
          user_id: data.created_by,
          role: 'owner',
        });
      }
      return {
        select: () => Promise.resolve({ data: [newFamily], error: null })
      };
    },
    update: (updates) => ({
      eq: (field, value) => ({
        select: () => {
          const idx = familiesDb.findIndex(f => f.id === value);
          if (idx === -1) return Promise.resolve({ data: null, error: { message: 'Família não encontrada' } });
          familiesDb[idx] = { ...familiesDb[idx], ...updates };
          return Promise.resolve({ data: [familiesDb[idx]], error: null });
        },
      }),
    }),
    select: () => ({
      eq: (field, value) => ({
        single: () => {
          const fam = familiesDb.find(f => f.id === value);
          if (!fam) return Promise.resolve({ data: null, error: { message: 'Família não encontrada' } });
          return Promise.resolve({ data: fam, error: null });
        },
        order: () => Promise.resolve({ data: familiesDb, error: null }),
      }),
      order: () => Promise.resolve({ data: familiesDb, error: null }),
      single: () => Promise.resolve({ data: familiesDb[0], error: null }),
    }),
    order: () => Promise.resolve({ data: familiesDb, error: null }),
    single: () => Promise.resolve({ data: familiesDb[0], error: null }),
  };
}

function goalsChainable() {
  let query = { eq: () => query, is: () => query, order: () => Promise.resolve({ data: goalsDb, error: null }), single: () => Promise.resolve({ data: goalsDb[0] || null, error: null }) };
  query.eq = (field, value) => {
    if (field === 'id') {
      return {
        single: () => {
          const goal = goalsDb.find(g => g.id === value);
          return Promise.resolve({ data: goal || null, error: goal ? null : { message: 'Meta não encontrada' } });
        }
      };
    }
    // Filtrar por outros campos (user_id, family_id, etc.)
    const filtered = goalsDb.filter(g => g[field] === value);
    return {
      order: () => Promise.resolve({ data: filtered, error: null }),
      single: () => Promise.resolve({ data: filtered[0] || null, error: null })
    };
  };
  query.is = (field, value) => query;
  query.order = () => Promise.resolve({ data: goalsDb, error: null });
  query.single = () => Promise.resolve({ data: goalsDb[0] || null, error: null });
  return {
    insert: (payload) => {
      const data = Array.isArray(payload) ? payload[0] : payload;
      if (!data?.nome || typeof data.valor_objetivo !== 'number' || data.valor_objetivo < 0) {
        return {
          select: () => Promise.resolve({ data: null, error: { message: 'Dados inválidos' } })
        };
      }
      const newGoal = { ...data, id: `goal-${goalsDb.length + 1}` };
      goalsDb.push(newGoal);
      return {
        select: () => Promise.resolve({ data: [newGoal], error: null })
      };
    },
    select: () => query,
    update: (updates) => ({
      eq: (field, value) => ({
        select: () => {
          const idx = goalsDb.findIndex(g => g.id === value);
          if (idx === -1) return Promise.resolve({ data: null, error: { message: 'Meta não encontrada' } });
          goalsDb[idx] = { ...goalsDb[idx], ...updates };
          return Promise.resolve({ data: [goalsDb[idx]], error: null });
        }
      })
    }),
    delete: () => ({
      eq: (field, value) => {
        const idx = goalsDb.findIndex(g => g.id === value);
        if (idx === -1) return Promise.resolve({ data: null, error: { message: 'Meta não encontrada' } });
        const removed = goalsDb.splice(idx, 1);
        return Promise.resolve({ data: removed, error: null });
      }
    })
  };
}

function transactionsChainable() {
  let query = { eq: () => query, is: () => query, order: () => Promise.resolve({ data: transactionsDb, error: null }), single: () => Promise.resolve({ data: transactionsDb[0] || null, error: null }) };
  query.eq = (field, value) => {
    if (field === 'id') {
      return {
        single: () => {
          const tx = transactionsDb.find(t => t.id === value);
          return Promise.resolve({ data: tx || null, error: tx ? null : { message: 'Transação não encontrada' } });
        },
        select: () => {
          const tx = transactionsDb.find(t => t.id === value);
          return Promise.resolve({ data: tx ? [tx] : [], error: tx ? null : { message: 'Transação não encontrada' } });
        }
      };
    }
    // Filtrar por outros campos (user_id, family_id, etc.)
    const filtered = transactionsDb.filter(t => t[field] === value);
    return {
      order: () => Promise.resolve({ data: filtered, error: null }),
      single: () => Promise.resolve({ data: filtered[0] || null, error: null }),
      select: () => Promise.resolve({ data: filtered, error: null })
    };
  };
  query.is = (field, value) => query;
  query.order = () => Promise.resolve({ data: transactionsDb, error: null });
  query.single = () => Promise.resolve({ data: transactionsDb[0] || null, error: null });
  return {
    insert: (payload) => {
      const data = Array.isArray(payload) ? payload[0] : payload;
      if (!data?.user_id || typeof data.valor !== 'number' || data.valor < 0) {
        return {
          select: () => Promise.resolve({ data: null, error: { message: 'Dados inválidos' } })
        };
      }
      const newTx = { ...data, id: `tx-${transactionsDb.length + 1}` };
      transactionsDb.push(newTx);
      return {
        select: () => Promise.resolve({ data: [newTx], error: null })
      };
    },
    select: () => query,
    update: (updates) => ({
      eq: (field, value) => ({
        select: () => {
          const idx = transactionsDb.findIndex(t => t.id === value);
          if (idx === -1) return Promise.resolve({ data: null, error: { message: 'Transação não encontrada' } });
          transactionsDb[idx] = { ...transactionsDb[idx], ...updates };
          return Promise.resolve({ data: [transactionsDb[idx]], error: null });
        }
      })
    }),
    delete: () => ({
      eq: (field, value) => {
        const idx = transactionsDb.findIndex(t => t.id === value);
        if (idx === -1) return Promise.resolve({ data: null, error: { message: 'Transação não encontrada' } });
        const removed = transactionsDb.splice(idx, 1);
        return Promise.resolve({ data: removed, error: null });
      }
    })
  };
}

function chainable(table) {
  if (table === 'families') return familiesChainable();
  if (table === 'family_members') {
    return {
      select: () => ({
        eq: (field, value) => ({
          select: () => {
            // Simular fetchFamilies: devolver as famílias associadas ao userId
            if (field === 'user_id') {
              const userFamilies = familyMembersDb
                .filter(fm => fm.user_id === value)
                .map(fm => {
                  const fam = familiesDb.find(f => f.id === fm.family_id);
                  return fam ? { family_id: fam.id, role: fm.role, families: fam } : null;
                })
                .filter(Boolean);
              return Promise.resolve({ data: userFamilies, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    };
  }
  if (table === 'goals') return goalsChainable();
  if (table === 'transactions') return transactionsChainable();
  return mockResult;
}

export function setMockSupabaseResult(result) {
  mockResult = result;
}

export const supabaseMock = {
  from: (table) => chainable(table),
  auth: {
    refreshSession: async ({ refresh_token }) => {
      if (refresh_token === 'validtoken') {
        return {
          data: {
            session: {
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
            },
          },
          error: null,
        };
      } else {
        return {
          data: null,
          error: { message: 'Token inválido ou expirado' },
        };
      }
    },
    getUser: async (token) => {
      if (token === 'validtoken') {
        return {
          data: { user: { id: 'user1', email: 'testuser@example.com' } },
          error: null,
        };
      } else if (!token || token === 'invalidtoken') {
        // Simular erro fatal para o middleware JWT
        throw { message: 'Token inválido ou não fornecido' };
      } else {
        return {
          data: null,
          error: { message: 'Token não reconhecido' },
        };
      }
    },
  },
}; 