/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ResponseEnvelope } from './types.js'

/**
 * MailResponse represents a consistent response object returned
 * by all the mail drivers
 */
export class MailResponse<T = undefined> {
  constructor(
    public messageId: string,
    public envelope: ResponseEnvelope,
    public original: T
  ) {}
}
