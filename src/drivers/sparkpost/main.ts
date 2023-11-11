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
  SparkPostConfig,
  NodeMailerMessage,
  MailDriverContract,
  SparkPostRuntimeConfig,
  SparkPostSentMessageInfo,
} from '../../types.js'

/**
 * Driver implementation to send emails using Sparkpost
 */
export class SparkPostDriver implements MailDriverContract {
  #config: SparkPostConfig

  constructor(config: SparkPostConfig) {
    this.#config = config
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: SparkPostRuntimeConfig
  ): Promise<MailResponse<SparkPostSentMessageInfo>> {
    const { SparkPostTransport } = await import('./transport.js')
    const sparkpostTransport = new SparkPostTransport({ ...this.#config, ...config })
    const transporter = createTransport<SparkPostSentMessageInfo>(sparkpostTransport)

    const sparkPostResponse = await transporter.sendMail(message)
    return new MailResponse(
      sparkPostResponse.messageId,
      sparkPostResponse.envelope,
      sparkPostResponse
    )
  }

  /**
   * noop
   */
  async close() {}
}
