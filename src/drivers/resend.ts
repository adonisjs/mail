/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Logger } from '@adonisjs/core/logger'
import { BrevoResponse } from '../types/drivers/brevo.js'
import { MailDriverContract } from '../types/main.js'
import { MessageNode } from '../types/message.js'
import nodemailer from 'nodemailer'
import { ResendTransport } from '../transports/resend.js'
import { ResendConfig, ResendRuntimeConfig } from '../types/drivers/resend.js'

/**
 * Driver for sending emails using Brevo ( ex-sendinblue )
 */
export class ResendDriver implements MailDriverContract {
  #config: ResendConfig
  #logger: Logger

  constructor(config: ResendConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Send message
   */
  async send(message: MessageNode, config?: ResendRuntimeConfig): Promise<BrevoResponse> {
    const mailgunTransport = new ResendTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = nodemailer.createTransport(mailgunTransport)

    return transporter.sendMail(message as any) as any
  }

  async close() {}
}
