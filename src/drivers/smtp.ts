/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import { SmtpConfig, SmtpMailResponse } from '../types/drivers/smtp.js'
import { MailDriverContract, MessageNode } from '../types/main.js'
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js'

/**
 * Smtp driver to send email using smtp
 */
export class SmtpDriver implements MailDriverContract {
  #transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null

  constructor(config: SmtpConfig) {
    this.#transporter = nodemailer.createTransport(config as SMTPTransport.Options)
  }

  /**
   * Send message
   */
  async send(message: MessageNode): Promise<SmtpMailResponse> {
    if (!this.#transporter) {
      throw new Error('Driver transport has been closed and cannot be used for sending emails')
    }

    // @ts-expect-error internal
    return this.#transporter.sendMail(message)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  async close() {
    if (!this.#transporter) {
      return
    }

    this.#transporter.close()
    this.#transporter = null
  }
}
