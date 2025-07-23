# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fb694105-4d1e-41e0-87f6-2a2c16e50baf

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fb694105-4d1e-41e0-87f6-2a2c16e50baf) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fb694105-4d1e-41e0-87f6-2a2c16e50baf) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Scripts SQL antigos

Todos os scripts SQL antigos e ficheiros de dump foram movidos para a pasta `archive/sql/` na raiz do projeto. Apenas a pasta `supabase/migrations/` deve ser usada para novas migrações.

## Testes de Hooks com Supabase (Importante)

### Limitação do Jest com ESM
O ambiente de testes atual (Jest + ts-jest) **não suporta importar módulos ESM puros de node_modules**, como o Supabase e algumas das suas dependências. Isto significa que qualquer teste que tente importar o cliente real do Supabase irá falhar com erros de parsing (ex: `SyntaxError: Cannot use import statement outside a module`).

### Padrão Obrigatório: Mock do Supabase
**Todos os testes unitários de hooks que usam Supabase devem usar mocks para o cliente Supabase.**

- Nunca importes o cliente real do Supabase em testes unitários.
- Usa sempre o padrão:

```ts
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => mockQuery),
  },
}));
```

- Garante que todos os métodos encadeados usados no hook (ex: `select`, `eq`, `is`, `order`, `update`, `delete`) estão mockados.
- Testes de integração real só são possíveis em ambiente que suporte ESM nativamente (ex: Vitest, Jest ESM puro, Node).

### Exemplo de mock robusto:

```ts
const mockQuery = {
  select: jest.fn(function () { return this; }),
  eq: jest.fn(function () { return this; }),
  is: jest.fn(function () { return this; }),
  order: jest.fn(async function () { return { data: [{ id: '1', nome: 'Meta Teste' }], error: null }; }),
  update: jest.fn(async function () { return { data: { id: '1', nome: 'Meta Atualizada' }, error: null }; }),
  delete: jest.fn(async function () { return { error: null }; }),
};
```

Se precisares de testar integração real com Supabase, considera migrar para Vitest ou configurar Jest para ESM puro.
