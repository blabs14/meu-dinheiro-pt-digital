import { authService } from '../../features/auth/services/authService';
import { familyService } from '../../features/family/services/familyService';
import { goalService } from '../../features/goals/services/goalService';
import { transactionService } from '../../features/transactions/services/transactionService';

describe('Testes Unitários - Services', () => {
  describe('AuthService', () => {
    it('deve validar dados de signup', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        nome: 'Test User'
      };
      
      const result = await authService.signup(validData);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('deve rejeitar dados inválidos de signup', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        nome: ''
      };
      
      const result = await authService.signup(invalidData);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('FamilyService', () => {
    it('deve validar dados de família', async () => {
      const validData = {
        nome: 'Família Teste',
        created_by: '11111111-1111-1111-1111-111111111111',
        description: 'Descrição de teste'
      };
      
      const result = await familyService.createFamily(validData);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('deve rejeitar dados inválidos de família', async () => {
      const invalidData = {
        nome: '',
        created_by: 'invalid-id'
      };
      
      const result = await familyService.createFamily(invalidData);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('GoalService', () => {
    it('deve validar dados de meta', async () => {
      const validData = {
        nome: 'Meta Teste',
        valor_objetivo: 1000,
        valor_atual: 0,
        user_id: '11111111-1111-1111-1111-111111111111',
        tipo: 'pessoal',
        data_objetivo: '2024-12-31'
      };
      
      const result = await goalService.createGoal(validData);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('deve rejeitar dados inválidos de meta', async () => {
      const invalidData = {
        nome: '',
        valor_objetivo: -100,
        user_id: 'invalid-id'
      };
      
      const result = await goalService.createGoal(invalidData);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('TransactionService', () => {
    it('deve validar dados de transação', async () => {
      const validData = {
        valor: 100.50,
        tipo: 'receita',
        categoria_id: '11111111-1111-1111-1111-111111111111',
        data: '2024-01-15',
        descricao: 'Teste de transação',
        user_id: '11111111-1111-1111-1111-111111111111',
        account_id: '11111111-1111-1111-1111-111111111111'
      };
      
      const result = await transactionService.createTransaction(validData);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('deve rejeitar dados inválidos de transação', async () => {
      const invalidData = {
        valor: -100,
        tipo: 'invalido',
        user_id: 'invalid-id'
      };
      
      const result = await transactionService.createTransaction(invalidData);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('deve classificar transação corretamente', () => {
      const receita = transactionService.classifyTransaction('receita', 1000);
      const despesa = transactionService.classifyTransaction('despesa', 500);
      
      expect(receita).toBe('receita');
      expect(despesa).toBe('despesa');
    });
  });
}); 