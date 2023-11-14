/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Mailer } from './mailer.js'
import { Message } from './message.js'
import { MailDriverContract, Recipient } from './types.js'

/**
 * Class based emails are self contained dispatchable
 * mail objects
 */
export abstract class BaseMail {
  /**
   * Define the global from address
   */
  static from: Recipient

  #built: boolean = false

  /**
   * Reference to the mail message object
   */
  message = new Message()

  /**
   * Define the email subject
   */
  subject?: string

  /**
   * Define the from address for the email
   */
  from?: Recipient

  /**
   * Defines the subject on the message using the mail
   * class subject property
   */
  protected defineSubject() {
    if (this.subject) {
      this.message.subject(this.subject)
    }
  }

  /**
   * Defines the from on the message using the mail
   * class from property
   */
  protected defineSender() {
    const from = this.from || (this.constructor as typeof BaseMail).from
    if (from) {
      typeof from === 'string'
        ? this.message.from(from)
        : this.message.from(from.address, from.name)
    }
  }

  /**
   * Prepares the email message
   */
  abstract prepare(): void | Promise<void>

  /**
   * Builds the mail message for sending it
   */
  async build(): Promise<void> {
    if (this.#built) {
      return
    }

    this.#built = true
    this.defineSubject()
    this.defineSender()
    await this.prepare()
  }

  /**
   * Sends the mail
   */
  async send<T extends MailDriverContract>(
    mailer: Mailer<T>,
    config?: Parameters<T['send']>[1]
  ): Promise<Awaited<ReturnType<T['send']>>> {
    await this.build()
    return mailer.sendCompiled(this.message.toJSON(), config)
  }

  /**
   * Sends the mail by using the background
   * messenger
   */
  async sendLater<T extends MailDriverContract>(
    mailer: Mailer<T>,
    config?: Parameters<T['send']>[1]
  ) {
    await this.build()
    return mailer.sendLaterCompiled(this.message.toJSON(), config)
  }
}
