import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('real UI components label unknown statements, preserve explicit zero, and explain interval totals', async () => {
    const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
    try {
        const { CashFlowPanel } = await server.ssrLoadModule('/src/components/CashFlowSummary.jsx');
        const { PaymentItem } = await server.ssrLoadModule('/src/components/items/PaymentItem.jsx');
        const data = { products: [{ id: 1, type: 'card', paymentDueDay: 5, name: 'Fixture card' }] };
        const panel = renderToStaticMarkup(React.createElement(CashFlowPanel, { data, today: new Date(2026, 10, 1) }));
        assert.match(panel, /1 ekstre eksik · Sonuç kesinleşmedi/);
        assert.match(panel, /mevcut hesap bakiyen değildir/);
        assert.match(panel, /Tahmini · Ekstre eksik/);
        assert.doesNotMatch(panel, /gelir yeterli/i);
        const complete = renderToStaticMarkup(React.createElement(CashFlowPanel, { data: {}, today: new Date(2026, 10, 1) }));
        assert.match(complete, /Beklenen gelire dayalı tahmin/);
        assert.doesNotMatch(complete, /Sonuç kesinleşmedi/);
        assert.match(panel, /aria-pressed="true"[^>]*>7 gün/);
        assert.match(panel, />30 gün/);
        const unknown = renderToStaticMarkup(React.createElement(PaymentItem, { item: { type: 'card', title: 'Fixture', dueDate: '2026-11-05', needsCardAmount: true, amount: null }, onEdit: () => {} }));
        assert.match(unknown, /Ekstre tutarı girilmedi/);
        assert.match(unknown, /Ekstre tutarı gir/);
        assert.doesNotMatch(unknown, /title="Sil"/);
        const zero = renderToStaticMarkup(React.createElement(PaymentItem, { item: { type: 'card', title: 'Fixture', dueDate: '2026-11-05', amount: 0 }, onEdit: () => {} }));
        assert.match(zero, /₺0,00/);
        assert.doesNotMatch(zero, /Ekstre tutarı girilmedi/);
    } finally { await server.close(); }
});
