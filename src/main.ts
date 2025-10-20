import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SSI Cloud Wallet API')
    .setDescription(`
      A comprehensive cloud wallet implementation built on ACA-Py (Aries Cloud Agent Python).
      
      ## Features
      - Multi-tenant wallet management
      - DIDComm connection management
      - Verifiable credential operations
      - Proof presentation protocols
      - DID and schema management
      - Real-time webhook processing
      
      ## Authentication
      Each wallet requires a JWT token obtained via POST /api/wallet/{id}/token
      Include the token in the Authorization header: Bearer {token}
    `)
    .setVersion('1.0.0')
    .addTag('Wallet Management', 'Multi-tenant wallet creation and management')
    .addTag('Connections', 'DIDComm connection establishment and messaging')
    .addTag('Credentials', 'Verifiable credential issuance and storage')
    .addTag('Proofs', 'Proof presentation and verification')
    .addTag('DID & Schema Management', 'DID operations, schemas, and credential definitions')
    .addTag('Webhooks', 'Real-time event processing from ACA-Py')
    .addBearerAuth()
    .build();
    
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    customSiteTitle: 'SSI Cloud Wallet API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 5001;
  await app.listen(port);
  
  console.log(`🚀 SSI Cloud Wallet API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api`);
}

bootstrap();
