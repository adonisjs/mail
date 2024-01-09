/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import SES from '@aws-sdk/client-ses'
import NodeMailerTransport from 'nodemailer/lib/ses-transport/index.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import type { SESConfig, NodeMailerMessage, MailTransportContract } from '../types.js'

/**
 * SES transport uses the Nodemailer inbuilt transport for sending
 * emails
 */
export class SESTransport implements MailTransportContract {
  /**
   * SES config
   */
  #config: SESConfig

  /**
   * The nodemailer transport
   */
  #transporter?: nodemailer.Transporter<NodeMailerTransport.SentMessageInfo>

  constructor(config: SESConfig) {
    this.#config = config
  }

  /**
   * Create transporter instance
   */
  #createTransporter() {
    if (this.#transporter) {
      return this.#transporter
    }

    const SESClient = new SES.SES(this.#config)

    this.#transporter = nodemailer.createTransport({
      SES: { aws: SES, ses: SESClient },
      sendingRate: this.#config.sendingRate,
      maxConnections: this.#config.maxConnections,
    })

    return this.#transporter
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    options?: Omit<SES.SendRawEmailRequest, 'RawMessage' | 'Source' | 'Destinations'>
  ): Promise<MailResponse<NodeMailerTransport.SentMessageInfo>> {
    const transporter = this.#createTransporter()
    const mailOptions = Object.assign({}, message, { ses: options })

    const sesResponse = await transporter.sendMail(mailOptions)
    return new MailResponse(sesResponse.messageId, sesResponse.envelope, sesResponse)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  async close() {
    if (!this.#transporter) {
      return
    }

    debug('closing ses transport')
    this.#transporter.close()
    this.#transporter = undefined
  }
}
