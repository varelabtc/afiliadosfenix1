// Vercel Serverless Function - UTMify Integration
// Receives conversion data and forwards to UTMify API
// Docs: https://api.utmify.com.br/api-credentials/orders
//
// POST /api/utmify  — send a sale/conversion to UTMify
// GET  /api/utmify?action=test — test connection

const UTMIFY_ENDPOINT = 'https://api.utmify.com.br/api-credentials/orders';

function setCors(res) {
    const origin = process.env.ALLOWED_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
}

function validateAdminToken(req) {
    const adminToken = process.env.ADMIN_API_TOKEN;
    if (!adminToken) return true; // not configured = skip check (dev mode)
    const provided = req.headers['x-admin-token'] || req.query.admin_token;
    return provided === adminToken;
}

function sanitizeString(val, maxLen = 255) {
    if (val === null || val === undefined) return null;
    return String(val).slice(0, maxLen).replace(/[<>"']/g, '');
}

module.exports = async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiToken = process.env.UTMIFY_API_TOKEN;

    // GET: test connection
    if (req.method === 'GET') {
        if (!apiToken) {
            return res.status(200).json({ connected: false, message: 'UTMIFY_API_TOKEN não configurado' });
        }
        return res.status(200).json({ connected: true, message: 'Token UTMify configurado' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!validateAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!apiToken) {
        return res.status(500).json({ error: 'UTMIFY_API_TOKEN não configurado no servidor' });
    }

    const body = req.body || {};

    // Required field validation
    const required = ['orderId', 'platform', 'paymentMethod', 'status', 'createdAt', 'customer', 'products', 'trackingParameters', 'commission'];
    for (const field of required) {
        if (!body[field]) {
            return res.status(400).json({ error: `Campo obrigatório ausente: ${field}` });
        }
    }

    const validStatuses = ['waiting_payment', 'paid', 'refused', 'refunded', 'chargedback'];
    if (!validStatuses.includes(body.status)) {
        return res.status(400).json({ error: `status inválido. Use: ${validStatuses.join(', ')}` });
    }

    const validMethods = ['credit_card', 'boleto', 'pix', 'paypal', 'free_price'];
    if (!validMethods.includes(body.paymentMethod)) {
        return res.status(400).json({ error: `paymentMethod inválido. Use: ${validMethods.join(', ')}` });
    }

    // Build payload according to UTMify spec
    const payload = {
        orderId: sanitizeString(body.orderId, 100),
        platform: sanitizeString(body.platform, 100) || 'FenixAfiliados',
        paymentMethod: body.paymentMethod,
        status: body.status,
        createdAt: body.createdAt,
        approvedDate: body.approvedDate || null,
        refundedAt: body.refundedAt || null,
        customer: {
            name: sanitizeString(body.customer.name, 200),
            email: sanitizeString(body.customer.email, 200),
            phone: body.customer.phone ? sanitizeString(body.customer.phone, 20) : null,
            document: body.customer.document ? sanitizeString(body.customer.document, 20) : null,
            country: body.customer.country || 'BR',
            ip: body.customer.ip || null
        },
        products: (body.products || []).map(p => ({
            id: sanitizeString(p.id, 100),
            name: sanitizeString(p.name, 200),
            planId: p.planId || null,
            planName: p.planName || null,
            quantity: parseInt(p.quantity) || 1,
            priceInCents: parseInt(p.priceInCents) || 0
        })),
        trackingParameters: {
            src: body.trackingParameters.src || null,
            sck: body.trackingParameters.sck || null,
            utm_source: body.trackingParameters.utm_source || null,
            utm_campaign: body.trackingParameters.utm_campaign || null,
            utm_medium: body.trackingParameters.utm_medium || null,
            utm_content: body.trackingParameters.utm_content || null,
            utm_term: body.trackingParameters.utm_term || null
        },
        commission: {
            totalPriceInCents: parseInt(body.commission.totalPriceInCents) || 0,
            gatewayFeeInCents: parseInt(body.commission.gatewayFeeInCents) || 0,
            userCommissionInCents: parseInt(body.commission.userCommissionInCents) || 0,
            currency: body.commission.currency || 'BRL'
        },
        isTest: body.isTest === true
    };

    console.log('[UTMIFY] Enviando pedido:', JSON.stringify({ orderId: payload.orderId, status: payload.status, isTest: payload.isTest }));

    try {
        const utmRes = await fetch(UTMIFY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-token': apiToken
            },
            body: JSON.stringify(payload)
        });

        const responseText = await utmRes.text();
        let responseData;
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

        console.log('[UTMIFY] Resposta:', utmRes.status, JSON.stringify(responseData));

        return res.status(utmRes.status).json({
            success: utmRes.ok,
            status: utmRes.status,
            utmify: responseData,
            orderId: payload.orderId
        });
    } catch (err) {
        console.error('[UTMIFY] Erro na requisição:', err.message);
        return res.status(500).json({ error: 'Erro ao conectar com UTMify', details: err.message });
    }
};
