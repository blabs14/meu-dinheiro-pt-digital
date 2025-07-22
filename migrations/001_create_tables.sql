-- Migração inicial: criar tabelas essenciais

create table if not exists users (
  id uuid primary key,
  email text unique not null
);

create table if not exists families (
  id uuid primary key,
  nome text not null,
  created_by uuid references users(id),
  description text
);

create table if not exists family_members (
  id uuid primary key,
  family_id uuid references families(id),
  user_id uuid references users(id),
  role text not null
);

create table if not exists accounts (
  id uuid primary key,
  user_id uuid references users(id),
  nome text not null
);

create table if not exists categories (
  id uuid primary key,
  nome text not null,
  tipo text not null,
  cor text
);

create table if not exists goals (
  id uuid primary key,
  user_id uuid references users(id),
  nome text not null,
  valor_objetivo numeric not null,
  valor_atual numeric not null,
  data_limite date,
  descricao text,
  account_id uuid references accounts(id),
  family_id uuid references families(id)
);

create table if not exists transactions (
  id uuid primary key,
  user_id uuid references users(id),
  valor numeric not null,
  tipo text not null,
  categoria_id uuid references categories(id),
  data date not null,
  descricao text,
  account_id uuid references accounts(id),
  family_id uuid references families(id)
); 