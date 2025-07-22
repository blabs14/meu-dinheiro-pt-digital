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
  if (table === 'goals') {
    return {
      data: [
        {
          id: '1',
          nome: 'Meta Teste',
          user_id: 'user1',
          created_at: '2024-01-01',
          valor: 100,
          concluida: false
        }
      ],
      error: null
    };
  }
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