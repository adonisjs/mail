/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createTransport } from 'nodemailer'
import { SparkPostTransport } from './transport.js'
import {
  SparkPostConfig,
  SparkPostRuntimeConfig,
  SparkPostResponse,
} from './types.js'
import { MailDriverContract, MessageNode } from '../../types/main.js'
import { Logger } from '@adonisjs/core/logger'

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
    const sparkpostTransport = new SparkPostTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = createTransport(sparkpostTransport)

    // @ts-expect-error internal
    return transporter.sendMail(message)
  }

  async close() {}
}
