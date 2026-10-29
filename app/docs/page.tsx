'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApiDocsPage() {
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);

  useEffect(() => {
    fetch('/api/openapi.json')
      .then((res) => res.json())
      .then((data) => setOpenApiSpec(data))
      .catch((err) => console.error('Error loading OpenAPI spec:', err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            ⚡ Meeshaai OpenAPI & Developer Specification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            RFC 7807 Problem Details compliant endpoints for order lifecycle, payments, and admin controls.
          </p>
        </div>

        <a
          href="/api/postman.json"
          download="Meeshaai_postman_collection.json"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          <span>📥 Download Postman Collection</span>
        </a>
      </div>

      {/* RFC 7807 Error Format Box */}
      <div className="glass-panel p-6 space-y-3 border-amber-500/20">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
          RFC 7807 Error Response Schema
        </h2>
        <p className="text-xs text-slate-300">
          All API errors return a standard JSON problem details object with application/problem+json content type:
        </p>
        <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-amber-300/90 overflow-x-auto border border-slate-800">
{`{
  "type": "https://Meeshaai.com/errors/invalid-order-payload",
  "title": "Invalid Order Request",
  "status": 400,
  "detail": "Phone, items array, and delivery location are required.",
  "instance": "/api/orders"
}`}
        </pre>
      </div>

      {/* OpenAPI Endpoint Specs Listing */}
      {openApiSpec && openApiSpec.paths && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">
            Documented API Endpoints
          </h2>
          <div className="space-y-3">
            {Object.entries(openApiSpec.paths).map(([pathStr, methods]: [string, any]) => (
              <div key={pathStr} className="glass-panel p-4 space-y-2">
                <div className="font-mono font-bold text-sm text-amber-400">
                  {pathStr}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.keys(methods).map((method) => (
                    <span
                      key={method}
                      className="px-2 py-0.5 rounded font-mono font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700"
                    >
                      {method} - {methods[method].summary || 'Endpoint'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
