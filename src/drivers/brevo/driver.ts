/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'

import type { Logger } from '@adonisjs/core/logger'
import type { BrevoConfig, BrevoResponse, BrevoRuntimeConfig } from './types.js'
import type { MailDriverContract, NodeMailerMessage } from '../../types.js'

/**
 * Driver for sending emails using Brevo ( ex-sendinblue )
 */
export class BrevoDriver implements MailDriverContract {
  #config: BrevoConfig
  #logger: Logger

  constructor(config: BrevoConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Send message
   */
  async send(message: NodeMailerMessage, config?: BrevoRuntimeConfig): Promise<BrevoResponse> {
    const { BrevoTransport } = await import('./transport.js')
    const mailgunTransport = new BrevoTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = nodemailer.createTransport(mailgunTransport)

    return transporter.sendMail(message as any) as any
  }

  async close() {}
}
