import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Meeshaai Ordering Service API',
      description: 'Lightweight meal ordering platform backend for roadside bread & egg preset meals with Flutterwave payments, location check, and admin controls.',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development Server' },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check probe',
          responses: { '200': { description: 'Service is healthy' } },
        },
      },
      '/api/readiness': {
        get: {
          summary: 'Readiness check probe',
          responses: { '200': { description: 'Service is ready' } },
        },
      },
      '/api/catalog': {
        get: {
          summary: 'List available preset meals',
          responses: { '200': { description: 'List of active preset meals' } },
        },
      },
      '/api/quote': {
        post: {
          summary: 'Calculate order quote and delivery fee',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          presetId: { type: 'string' },
                          qty: { type: 'integer' },
                        },
                      },
                    },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Calculated line totals, delivery fee, and grand total in kobo' } },
        },
      },
      '/api/orders': {
        post: {
          summary: 'Create a new order (requires Idempotency-Key header)',
          parameters: [
            {
              in: 'header',
              name: 'idempotency-key',
              schema: { type: 'string' },
              description: 'Unique key for idempotency',
            },
          ],
          responses: { '201': { description: 'Order created in PENDING_PAYMENT state' } },
        },
      },
      '/api/orders/track': {
        get: {
          summary: 'Track guest order by order code and phone number',
          parameters: [
            { in: 'query', name: 'code', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'phone', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Order tracking details and audit trail' } },
        },
      },
      '/api/payments/initialize': {
        post: {
          summary: 'Initialize Flutterwave payment for an order',
          responses: { '200': { description: 'Checkout URL and transaction reference' } },
        },
      },
      '/api/payments/webhook': {
        post: {
          summary: 'Flutterwave webhook handler',
          parameters: [
            { in: 'header', name: 'verif-hash', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Webhook processed successfully' } },
        },
      },
      '/api/admin/orders': {
        get: { summary: 'List and filter orders for admin' },
      },
      '/api/admin/catalog': {
        get: { summary: 'List all presets including unavailable' },
        post: { summary: 'Create or update preset meal' },
      },
      '/api/admin/settings': {
        get: { summary: 'Get system settings and kill-switch state' },
        put: { summary: 'Update system settings' },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
