/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createTransport } from 'nodemailer'

import type { Logger } from '@adonisjs/core/logger'
import type { SparkPostConfig, SparkPostRuntimeConfig, SparkPostResponse } from './types.js'
import type { MailDriverContract, MessageNode } from '../../types/main.js'

/**
 * Driver to send email using sparkpost
 */
export class SparkPostDriver implements MailDriverContract {
  #config: SparkPostConfig
  #logger: Logger

  constructor(config: SparkPostConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Send message
   */
  async send(message: MessageNode, config?: SparkPostRuntimeConfig): Promise<SparkPostResponse> {
    const { SparkPostTransport } = await import('./transport.js')
    const sparkpostTransport = new SparkPostTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = createTransport(sparkpostTransport)

    // @ts-ignore
    return transporter.sendMail(message)
  }

  async close() {}
}
