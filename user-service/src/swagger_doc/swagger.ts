import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
/**
 * Get Swagger configuration for documentation.
 */
export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Food Order (User Service)')
    .setDescription('All User APIs are here, including user management, orders, and payments.')
    .setVersion('1.0')
    .setContact(
      'Support Team',
      'https://yourwebsite.com',
      'support@foodApp.com',
    )
    .setTermsOfService('http://localhost:9000/terms')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .setExternalDoc(
      'API Documentation',
      'http://localhost:9000',
    )
    .build();
}

/**
 * Set up Swagger UI with customizations
 * @param app The NestJS app instance
 * @param document The generated Swagger document
 */
export function setupSwaggerUI(app, document) {
  SwaggerModule.setup('api', app, document, {
    customCss: '.swagger-ui .topbar { background-color: #4CAF50; }',
    customJs: 'console.log("Custom Swagger UI script loaded!")',
    customSiteTitle: 'Food Order API Documentation',
  });
}
