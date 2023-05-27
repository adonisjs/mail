/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import { MailgunConfig, MailgunResponse, MailgunRuntimeConfig } from '../types/drivers/mailgun.js'
import { MailgunTransport } from '../transports/mailgun.js'
import { MailDriverContract, MessageNode } from '../types/main.js'
import { Logger } from '@adonisjs/core/logger'

/**
 * Ses driver to send email using ses
 */
export class MailgunDriver implements MailDriverContract {
  #config: MailgunConfig
  #logger: Logger

  constructor(config: MailgunConfig, logger: Logger) {
    this.#config = config
    this.#logger = logger
  }

  /**
   * Send message
   */
  async send(message: MessageNode, config?: MailgunRuntimeConfig): Promise<MailgunResponse> {
    const mailgunTransport = new MailgunTransport({ ...this.#config, ...config }, this.#logger)
    const transporter = nodemailer.createTransport(mailgunTransport)

    return transporter.sendMail(message as any) as any
  }

  async close() {}
}
