/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import { MailDriverContract, MessageNode } from '../types/main.js'
import { Logger } from '@adonisjs/core/logger'
import { BrevoConfig, BrevoResponse, BrevoRuntimeConfig } from '../types/drivers/brevo.js'
import { BrevoTransport } from '../transports/brevo.js'

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
  async send(message: MessageNode, config?: BrevoRuntimeConfig): Promise<BrevoResponse> {
    const mailgunTransport = new BrevoTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = nodemailer.createTransport(mailgunTransport)

    return transporter.sendMail(message as any) as any
  }

  async close() {}
}
