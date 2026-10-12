import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createDemoTransport, type DemoEnvelope, type DemoReply } from './transport';

const reply = (state: string, overrides: Partial<DemoReply> = {}) => Response.json({
  version: 1, status: 200, headers: {}, body: { ok: true }, state, cookies: {}, ...overrides,
});

describe('visitor-owned demo transport', () => {
  it('preserves capacity errors without replacing the last successful state', async () => {
    const send = vi.fn().mockResolvedValueOnce(reply('valid'))
      .mockResolvedValueOnce(Response.json({ code: 'DEMO_FILE_TOO_LARGE', message: '파일당 512KB까지 가능합니다.' }, { status: 413 }))
      .mockResolvedValueOnce(reply('next'));
    const api = axios.create({ adapter: createDemoTransport(send).adapter });
    await api.get('/health');
    await expect(api.post('/files', {})).rejects.toMatchObject({
      response: { status: 413, data: { code: 'DEMO_FILE_TOO_LARGE' } },
    });
    await api.get('/health');
    expect(JSON.parse(String(send.mock.calls[2][1].body)).state).toBe('valid');
  });

  it('keeps two visitors isolated and carries each visitor snapshot forward', async () => {
    const sent: DemoEnvelope[] = [];
    const send = vi.fn(async (_url: string, init: RequestInit) => {
      const message = JSON.parse(String(init.body)) as DemoEnvelope;
      sent.push(message);
      return reply(message.path);
    });
    const one = axios.create({ adapter: createDemoTransport(send).adapter });
    const two = axios.create({ adapter: createDemoTransport(send).adapter });
    await one.get('/visitor-one');
    await two.get('/visitor-two');
    await one.get('/read-one');
    await two.get('/read-two');
    expect(sent.map((item) => item.state)).toEqual([undefined, undefined, '/visitor-one', '/visitor-two']);
  });

  it('serializes dependent writes instead of forking the same previous state', async () => {
    let finish: (value: Response) => void = () => undefined;
    const inputs: DemoEnvelope[] = [];
    const send = vi.fn((_url: string, init: RequestInit) => {
      inputs.push(JSON.parse(String(init.body)) as DemoEnvelope);
      return inputs.length === 1 ? new Promise<Response>((resolve) => { finish = resolve; }) : Promise.resolve(reply('two'));
    });
    const api = axios.create({ adapter: createDemoTransport(send).adapter });
    const first = api.post('/students', { name: '첫 학생' });
    const second = api.post('/students', { name: '다음 학생' });
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    finish(reply('one'));
    await Promise.all([first, second]);
    expect(inputs[1].state).toBe('one');
  });

  it('retains the latest state and virtual cookie jar even for a business conflict', async () => {
    const send = vi.fn().mockResolvedValueOnce(reply('after-conflict', {
      status: 409, body: { code: 'VERSION_CONFLICT' }, cookies: { refresh: 'demo-only' },
    })).mockResolvedValueOnce(reply('after-read'));
    const api = axios.create({ adapter: createDemoTransport(send).adapter });
    await expect(api.patch('/reports/1', {})).rejects.toMatchObject({ response: { status: 409 } });
    await api.get('/reports/1');
    const next = JSON.parse(String(send.mock.calls[1][1].body)) as DemoEnvelope;
    expect(next.state).toBe('after-conflict');
    expect(next.cookies).toEqual({ refresh: 'demo-only' });
    expect(send.mock.calls[1][1].credentials).toBe('omit');
  });

  it('does not adopt a pending response from before reset', async () => {
    let finish: (value: Response) => void = () => undefined;
    const send = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce(reply('fresh'));
    const memory = createDemoTransport(send);
    const api = axios.create({ adapter: memory.adapter });
    const previous = api.get('/students');
    const rejected = expect(previous).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    memory.reset();
    finish(reply('stale'));
    await rejected;
    await api.get('/students');
    expect(JSON.parse(String(send.mock.calls[1][1].body)).state).toBeUndefined();
  });

  it('rejects external API targets before fetch and keeps query encoding', async () => {
    const send = vi.fn().mockResolvedValue(reply('ok'));
    const api = axios.create({ adapter: createDemoTransport(send).adapter });
    await expect(api.get('https://example.com/private')).rejects.toMatchObject({ code: 'DEMO_EXTERNAL_REQUEST' });
    expect(send).not.toHaveBeenCalled();
    await api.get('/students', { params: { query: '합성 학생', page: 2 } });
    const body = JSON.parse(String(send.mock.calls[0][1].body)) as DemoEnvelope;
    expect(new URL(body.path, 'https://demo.invalid').searchParams.get('query')).toBe('합성 학생');
  });

  it('restores binary file responses without an external storage URL', async () => {
    const send = vi.fn().mockResolvedValue(reply('with-file', {
      body: btoa('demo-file'), encoding: 'base64', headers: { 'content-type': 'text/plain' },
    }));
    const api = axios.create({ adapter: createDemoTransport(send).adapter });
    const response = await api.get('/files/1', { responseType: 'arraybuffer' });
    expect(new TextDecoder().decode(response.data)).toBe('demo-file');
  });
});
