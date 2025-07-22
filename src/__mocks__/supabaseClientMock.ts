// Mock reutilizável para o cliente Supabase

export const mockQuery = {
  select: jest.fn(function () { console.log('[mockQuery] select chamado'); return this; }),
  eq: jest.fn(function () { console.log('[mockQuery] eq chamado'); return this; }),
  is: jest.fn(function () { console.log('[mockQuery] is chamado'); return this; }),
  order: jest.fn(function () { console.log('[mockQuery] order chamado'); return this; }),
  update: jest.fn(function () { console.log('[mockQuery] update chamado'); return this; }),
  delete: jest.fn(function () { console.log('[mockQuery] delete chamado'); return this; }),
  single: jest.fn(async function () {
    console.log('[mockQuery] single chamado');
    return {
      data: {
        id: '1',
        nome: 'Meta Teste',
        created_by: 'user1',
        created_at: '2024-01-01',
        settings: {
          allow_view_all: true,
          allow_add_transactions: true,
          require_approval: false,
        },
      },
      error: null,
    };
  }),
};

export const supabaseMock = {
  from: jest.fn(() => mockQuery),
}; 