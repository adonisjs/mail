/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Message } from '../message/index.js'
import {
  MailDriversListContract,
  MailerContract,
  MailerService,
  MailersList,
} from '../types/main.js'

export abstract class BaseMailer {
  static mail: MailerService

  /**
   * An optional method to use a custom mailer and its options
   */
  mailer?: MailerContract<MailersList extends MailDriversListContract ? MailersList : never, any>

  /**
   * Prepare mail message
   */
  abstract prepare(message: Message): Promise<any> | any

  resolvedMailer() {
    return this.mailer || BaseMailer.mail.use()
  }

  /**
   * Preview email
   */
  async preview() {
    return BaseMailer.mail.preview(async (message) => await this.prepare(message))
  }

  /**
   * Send email
   */
  async send() {
    return this.resolvedMailer().send(async (message) => await this.prepare(message))
  }

  /**
   * Send email by pushing it to the in-memory queue
   */
  async sendLater() {
    return this.resolvedMailer().sendLater(async (message) => await this.prepare(message))
  }
}
