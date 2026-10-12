/* Generate the demo contract from its DTOs without credentials, network calls, or a live database. */
const net = require('node:net');
net.Socket.prototype.connect = function forbiddenConnect() { throw new Error('DEMO_TEST_NETWORK_FORBIDDEN'); };
global.fetch = async () => { throw new Error('DEMO_TEST_FETCH_FORBIDDEN'); };
process.env.NODE_ENV = 'production';
require('../dist/demo/environment.js');
const fs = require('node:fs');
const { createApp } = require('../dist/src/app.factory.js');
const { buildOpenApi } = require('../dist/src/openapi.js');
(async () => {
  const app = await createApp();
  try {
    // 원본 타입 생성기는 global prefix 없는 AppModule에서 계약을 추출한다.
    // /api/v1은 transport가 소유하므로 동일한 상대 경로 계약을 유지한다.
    app.setGlobalPrefix('');
    const document = buildOpenApi(app);
    fs.writeFileSync('openapi.json', JSON.stringify(document, null, 2) + '\n');
    const verbs = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
    console.log(JSON.stringify({ operations: Object.values(document.paths).reduce((sum, path) => sum + Object.keys(path).filter((key) => verbs.has(key)).length, 0) }));
  } finally { await app.close(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
