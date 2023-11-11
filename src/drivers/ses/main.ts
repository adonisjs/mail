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
import SESTransport from 'nodemailer/lib/ses-transport/index.js'

import { MailResponse } from '../../mail_response.js'
import type { SESConfig, NodeMailerMessage, MailDriverContract } from '../../types.js'

/**
 * SES driver uses the Nodemailer inbuilt transport for sending
 * emails
 */
export class SESDriver implements MailDriverContract {
  /**
   * SES config
   */
  #config: SESConfig

  /**
   * The nodemailer transport
   */
  #transporter?: nodemailer.Transporter<SESTransport.SentMessageInfo>

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

    const SESClient = new SES.SES({
      apiVersion: this.#config.apiVersion,
      region: this.#config.region,
      credentials: {
        accessKeyId: this.#config.key,
        secretAccessKey: this.#config.secret,
      },
    })

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
  ): Promise<MailResponse<SESTransport.SentMessageInfo>> {
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

    this.#transporter.close()
    this.#transporter = undefined
  }
}
