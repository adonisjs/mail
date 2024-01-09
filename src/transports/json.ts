/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createTransport } from 'nodemailer'
import type NodeMailerTransport from 'nodemailer/lib/json-transport/index.js'

import { MailResponse } from '../mail_response.js'
import type { MailTransportContract, NodeMailerMessage } from '../types.js'

/**
 * JSON transport returns the mail message as a JSON object
 */
export class JSONTransport implements MailTransportContract {
  #transporter = createTransport({ jsonTransport: true })

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage
  ): Promise<MailResponse<NodeMailerTransport.SentMessageInfo>> {
    const jsonResponse = await this.#transporter.sendMail(message)

    return new MailResponse(jsonResponse.messageId, jsonResponse.envelope, jsonResponse)
  }
}
