/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import type NodemailerTransport from 'nodemailer/lib/smtp-transport/index.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import type { SMTPConfig, NodeMailerMessage, MailTransportContract } from '../types.js'

/**
 * SMTP transport uses the Nodemailer inbuilt transport for sending
 * emails
 */
export class SMTPTransport implements MailTransportContract {
  #config: SMTPConfig
  #transporter?: nodemailer.Transporter<NodemailerTransport.SentMessageInfo>

  constructor(config: SMTPConfig) {
    this.#config = config
  }

  /**
   * Create transporter instance
   */
  #createTransporter() {
    if (this.#transporter) {
      return this.#transporter
    }

    this.#transporter = nodemailer.createTransport(this.#config as NodemailerTransport.Options)
    return this.#transporter
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage
  ): Promise<MailResponse<NodemailerTransport.SentMessageInfo>> {
    const transporter = this.#createTransporter()
    const smtpResponse = await transporter.sendMail(message)
    return new MailResponse(smtpResponse.messageId, smtpResponse.envelope, smtpResponse)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  async close() {
    if (!this.#transporter) {
      return
    }

    debug('closing smtp transport')
    this.#transporter.close()
    this.#transporter = undefined
  }
}
