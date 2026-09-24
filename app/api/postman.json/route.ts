import { NextResponse } from 'next/server';

export async function GET() {
  const collection = {
    info: {
      name: 'Meshaai API Collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: 'Complete API collection for Meshaai bread & eggs ordering service.',
    },
    item: [
      {
        name: 'System Health',
        request: { method: 'GET', url: '{{baseUrl}}/api/health' },
      },
      {
        name: 'Readiness Probe',
        request: { method: 'GET', url: '{{baseUrl}}/api/readiness' },
      },
      {
        name: 'Catalog - List Active Presets',
        request: { method: 'GET', url: '{{baseUrl}}/api/catalog' },
      },
      {
        name: 'Quote - Calculate Prices & Delivery Fee',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              items: [{ presetId: 'preset-1', qty: 2 }],
              location: { lat: 6.5244, lng: 3.3792 },
            }),
          },
          url: '{{baseUrl}}/api/quote',
        },
      },
      {
        name: 'Orders - Create Order',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Idempotency-Key', value: 'idem-12345678' },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              phone: '08012345678',
              items: [{ presetId: 'preset-1', qty: 1 }],
              location: {
                lat: 6.5244,
                lng: 3.3792,
                address: '12 Commercial Avenue, Yaba, Lagos',
                landmark: 'Opposite Domino Pizza',
              },
              note: 'Extra pepper sauce please',
            }),
          },
          url: '{{baseUrl}}/api/orders',
        },
      },
      {
        name: 'Orders - Track Order',
        request: {
          method: 'GET',
          url: '{{baseUrl}}/api/orders/track?code=MSH-4F7K2&phone=08012345678',
        },
      },
      {
        name: 'Payments - Initialize Checkout',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify({ orderCode: 'MSH-4F7K2' }),
          },
          url: '{{baseUrl}}/api/payments/initialize',
        },
      },
      {
        name: 'Admin - List Orders',
        request: {
          method: 'GET',
          url: '{{baseUrl}}/api/admin/orders',
        },
      },
      {
        name: 'Admin - Get Settings',
        request: {
          method: 'GET',
          url: '{{baseUrl}}/api/admin/settings',
        },
      },
    ],
    variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }],
  };

  return NextResponse.json(collection, {
    headers: {
      'Content-Disposition': 'attachment; filename="meshaai_postman_collection.json"',
    },
  });
}
