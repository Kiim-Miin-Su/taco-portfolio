/** Exercise the existing Nest controllers with in-process HTTP injection, never a TCP listener. */
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import inject from 'light-my-request';
import { SENDER } from '../src/modules/notify/sender';
import { FakeSender } from '../test/fake-sender';

export async function httpSmoke(ds: DataSource): Promise<Record<string, unknown>> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'portfolio-demo-access-only-2026';
  process.env.JWT_REFRESH_SECRET = 'portfolio-demo-refresh-only-2026';
  process.env.COOKIE_DOMAIN = '';
  process.env.COOKIE_CROSS_SITE = 'false';
  process.env.COOKIE_SAME_ORIGIN_PROXY = 'false';
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SENS_SERVICE_ID', 'SENS_ACCESS_KEY', 'SENS_SECRET_KEY', 'SENS_FROM', 'BLOB_READ_WRITE_TOKEN']) {
    process.env[key] = '';
  }
  const { AppModule } = await import('../src/app.module');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource).useValue(ds)
    .overrideProvider(SENDER).useValue(new FakeSender())
    .compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.init();
  const handler = app.getHttpAdapter().getInstance();
  const health = await inject(handler, { method: 'GET', url: '/api/v1/health' });
  const login = await inject(handler, { method: 'POST', url: '/api/v1/auth/login', payload: { loginId: 'demo-ceo', password: 'PortfolioDemo!2026' } });
  const loginBody = login.json<{ accessToken?: string }>();
  if (!loginBody.accessToken) { throw new Error(`DEMO_LOGIN_FAILED_${login.statusCode}`); }
  const headers = { authorization: `Bearer ${loginBody.accessToken}` };
  const meta = await inject(handler, { method: 'GET', url: '/api/v1/meta', headers });
  const students = await inject(handler, { method: 'GET', url: '/api/v1/students', headers });
  const denied = await inject(handler, { method: 'GET', url: '/api/v1/students' });
  const result = { health: health.statusCode, login: login.statusCode, meta: meta.statusCode, students: students.statusCode, anonymousStudents: denied.statusCode };
  // Closing the app also owns/destroys its DataSource, so let the process owner close it last.
  if (health.statusCode !== 200 || meta.statusCode !== 200 || students.statusCode !== 200 || denied.statusCode !== 401) {
    throw new Error(`DEMO_HTTP_SMOKE_FAILED_${JSON.stringify(result)}`);
  }
  return result;
}
