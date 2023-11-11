/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'

import { MailgunTransport } from './transport.js'
import { MailResponse } from '../../mail_response.js'

import type {
  MailgunConfig,
  NodeMailerMessage,
  MailDriverContract,
  MailgunRuntimeConfig,
  MailgunSentMessageInfo,
} from '../../types.js'

/**
 * Driver implementation to send emails using Mailgun
 */
export class MailgunDriver implements MailDriverContract {
  #config: MailgunConfig

  constructor(config: MailgunConfig) {
    this.#config = config
  }

  /**
   * Sends message using the transport
   */
  async send(
    message: NodeMailerMessage,
    config?: MailgunRuntimeConfig
  ): Promise<MailResponse<MailgunSentMessageInfo>> {
    const mailgunTransport = new MailgunTransport({ ...this.#config, ...config })
    const transporter = nodemailer.createTransport<MailgunSentMessageInfo>(mailgunTransport)

    const mailgunResponse = await transporter.sendMail(message)
    return new MailResponse(mailgunResponse.messageId, mailgunResponse.envelope, mailgunResponse)
  }

  /**
   * noop
   */
  async close() {}
}
