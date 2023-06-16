/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import { subsetCompare } from '../utils/index.js'
import { FakeMailResponse } from '../types/drivers/fake.js'
import { MailDriverContract, MessageNode, MessageSearchNode } from '../types/main.js'

export class FakeDriver implements MailDriverContract {
  #transporter: any

  mails: MessageNode[] = []

  constructor() {
    this.#transporter = nodemailer.createTransport({ jsonTransport: true })
  }

  /**
   * Find an email
   */
  find(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean),
  ): MessageNode | null {
    if (typeof messageOrCallback === 'function') {
      return this.mails.find(messageOrCallback) || null
    }

    return this.mails.find((mail) => subsetCompare(messageOrCallback, mail)) || null
  }

  /**
   * Filter emails
   */
  filter(
    messageOrCallback: MessageSearchNode | ((mail: MessageSearchNode) => boolean),
  ): MessageNode[] {
    if (typeof messageOrCallback === 'function') {
      return this.mails.filter(messageOrCallback)
    }

    return this.mails.filter((mail) => subsetCompare(messageOrCallback, mail))
  }

  /**
   * Send message
   */
  async send(message: MessageNode): Promise<FakeMailResponse> {
    if (!this.#transporter) {
      throw new Error('Driver transport has been closed and cannot be used for sending emails')
    }

    this.mails.push(message)
    return this.#transporter.sendMail(message)
  }

  /**
   * Close transporter connection, helpful when using connections pool
   */
  async close() {
    this.#transporter.close()
    this.mails = []
    this.#transporter = null
  }
}
