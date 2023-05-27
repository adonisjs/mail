/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createTransport } from 'nodemailer'
import { SparkPostTransport } from '../transports/sparkpost.js'
import {
  SparkPostConfig,
  SparkPostRuntimeConfig,
  SparkPostResponse,
} from '../types/drivers/sparkpost.js'
import { MailDriverContract, MessageNode } from '../types/main.js'
import { Logger } from '@adonisjs/core/logger'

/**
 * Ses driver to send email using ses
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
