/* Test helper: visitor state arrives through stdin, stays in RAM, and is never printed. */
const net = require('node:net');
net.Socket.prototype.connect = function () { throw new Error('DEMO_TEST_NETWORK_FORBIDDEN'); };
global.fetch = async () => { throw new Error('DEMO_TEST_FETCH_FORBIDDEN'); };
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { handleDemoRequest } = require('../dist/demo/entry.js');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
handleDemoRequest({ version: 1, method: 'GET', path: `/files/${input.fileId}`, state: input.state, cookies: input.cookies, headers: { authorization: `Bearer ${input.token}` } })
  .then((reply) => {
    console.log(JSON.stringify({ status: reply.status, encoding: reply.encoding, sha256: reply.encoding === 'base64' ? createHash('sha256').update(Buffer.from(reply.body, 'base64')).digest('hex') : null }));
    process.exit(0);
  }).catch(() => { process.exit(1); });
