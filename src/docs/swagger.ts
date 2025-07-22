import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Meu Dinheiro PT Digital API',
    version: '1.0.0',
    description: 'API RESTful para gestão financeira familiar',
  },
  servers: [
    { url: 'http://localhost:8081', description: 'Dev local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/features/auth/routes/authRoutes.ts'], // Adicionar mais rotas conforme necessário
};

export const swaggerSpec = swaggerJSDoc(options); 