/** All delivery is simulated in the visitor's isolated demo ledger. No email/SMS provider is called. */
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SendChannel, SendRequest, SendResult, Sender } from '../src/modules/notify/sender';

@Injectable()
export class DemoSender implements Sender {
  ready(_channel: SendChannel): boolean { return true; }
  async send(_request: SendRequest): Promise<SendResult> {
    return { configured: true, ok: true, providerId: `demo-simulated-${randomUUID()}`, error: null };
  }
}
