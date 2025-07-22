let mockResult: any = { data: null, error: null };

export function setMockSupabaseResult(result: any) {
  mockResult = result;
}

export const supabaseMock = {
  from: () => ({
    select: () => ({
      eq: () => ({
        is: () => ({
          order: () => Promise.resolve(mockResult),
          single: () => Promise.resolve(mockResult),
        }),
        order: () => Promise.resolve(mockResult),
        single: () => Promise.resolve(mockResult),
      }),
      order: () => Promise.resolve(mockResult),
      single: () => Promise.resolve(mockResult),
    }),
    order: () => Promise.resolve(mockResult),
    single: () => Promise.resolve(mockResult),
  }),
}; 