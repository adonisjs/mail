/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import type JSONTransport from 'nodemailer/lib/json-transport/index.js'

import debug from '../../debug.js'
import { MailResponse } from '../../mail_response.js'
import type { MailDriverContract, NodeMailerMessage } from '../../types.js'

/**
 * JSON driver returns the mail message as a JSON object
 */
export class JSONDriver implements MailDriverContract {
  #transporter?: nodemailer.Transporter<JSONTransport.SentMessageInfo>

  /**
   * Create transporter instance
   */
  #createTransporter() {
    if (this.#transporter) {
      return this.#transporter
    }

    this.#transporter = nodemailer.createTransport({ jsonTransport: true })
    return this.#transporter
  }

  /**
   * Send message
   */
  async send(message: NodeMailerMessage): Promise<MailResponse<JSONTransport.SentMessageInfo>> {
    const transporter = this.#createTransporter()
    const jsonResponse = await transporter.sendMail(message)

    return new MailResponse(jsonResponse.messageId, jsonResponse.envelope, jsonResponse)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  async close() {
    if (!this.#transporter) {
      return
    }

    debug('closing json transport')
    this.#transporter.close()
    this.#transporter = undefined
  }
}
