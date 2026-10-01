const { Client } = require('pg');
const { randomBytes } = require('node:crypto');
function configure() {
    const input = process.env.ASTRA_TEST_DATABASE_URL;
    if (!input)
        throw new Error('Set ASTRA_TEST_DATABASE_URL to an isolated PostgreSQL database named astra_test_*');
    const url = new URL(input);
    if (!/^astra_test_[a-z0-9_]+$/.test(url.pathname.slice(1)))
        throw new Error('Tests require a dedicated astra_test_* database');
    process.env.DATABASE_URL = input;
    process.env.DB_HOST = url.hostname;
    process.env.DB_PORT = url.port || '5432';
    process.env.DB_NAME = url.pathname.slice(1);
    process.env.DB_USER = decodeURIComponent(url.username);
    process.env.DB_PASSWORD = decodeURIComponent(url.password) || 'local-test';
    process.env.DB_SSL = 'false';
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'astra-local-test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'astra-local-test-refresh-secret';
    process.env.COOKIE_SECRET = 'astra-local-test-cookie-secret';
    return input;
}
async function prepare(db, up, { keepPool = false } = {}) {
    const connectionString = configure();
    const schema = `astra_${Date.now()}_${randomBytes(5).toString('hex')}`;
    const admin = new Client({ connectionString });
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    db.client.config.searchPath = [schema];
    db.client.searchPath = [schema];
    await up(db);
    return async () => {
        // keepPool lets several test blocks share one Knex pool while each owns a schema.
        if (!keepPool) await db.destroy();
        // Only the unique schema created above is removed; never an existing schema.
        await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
        await admin.end();
    };
}
async function listen(app) {
    const server = await new Promise((resolve, reject) => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
        instance.on('error', reject);
    });
    return {
        async request(method, path, body, token) {
            const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
                method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            return { status: response.status, body: await response.json() };
        },
        close: () => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }),
    };
}
module.exports = { configure, prepare, listen };
