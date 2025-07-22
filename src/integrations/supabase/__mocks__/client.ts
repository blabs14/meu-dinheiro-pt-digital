export const mockQuery = {
  select: jest.fn(function () { return this; }),
  eq: jest.fn(function () { return this; }),
  is: jest.fn(function () { return this; }),
  order: jest.fn(function () { return this; }),
  update: jest.fn(function () { return this; }),
  delete: jest.fn(function () { return this; }),
  single: jest.fn(async function () {
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
export const supabase = {
  from: jest.fn(() => mockQuery),
}; 