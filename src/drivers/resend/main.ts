/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createTransport } from 'nodemailer'
import { MailResponse } from '../../mail_response.js'
import type {
  ResendConfig,
  NodeMailerMessage,
  MailDriverContract,
  ResendRuntimeConfig,
  ResendSentMessageInfo,
} from '../../types.js'

/**
 * Driver for sending emails using Brevo ( ex-sendinblue )
 */
export class ResendDriver implements MailDriverContract {
  #config: ResendConfig

  constructor(config: ResendConfig) {
    this.#config = config
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: ResendRuntimeConfig
  ): Promise<MailResponse<ResendSentMessageInfo>> {
    const { ResendTransport } = await import('./transport.js')
    const sparkpostTransport = new ResendTransport({ ...this.#config, ...config })
    const transporter = createTransport<ResendSentMessageInfo>(sparkpostTransport)

    const sparkPostResponse = await transporter.sendMail(message)
    return new MailResponse(
      sparkPostResponse.messageId,
      sparkPostResponse.envelope,
      sparkPostResponse
    )
  }

  async close() {}
}
