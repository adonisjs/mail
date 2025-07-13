/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Message } from './message.js'
import { type Recipient, type MailerContract } from './types.js'

/**
 * Class based emails are self contained dispatchable
 * mail objects
 */
export abstract class BaseMail {
  /**
   * A flag to track if the message has been built
   */
  protected built: boolean = false

  /**
   * A flag to track if the mail templates have been rendered
   */
  protected renderedTemplates: boolean = false

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
   * Define the replyTo email address
   */
  replyTo?: Recipient

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
    if (this.from) {
      typeof this.from === 'string'
        ? this.message.from(this.from)
        : this.message.from(this.from.address, this.from.name)
    }

    if (this.replyTo) {
      typeof this.replyTo === 'string'
        ? this.message.replyTo(this.replyTo)
        : this.message.replyTo(this.replyTo.address, this.replyTo.name)
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
    if (this.built) {
      return
    }

    this.built = true
    this.defineSubject()
    this.defineSender()
    await this.prepare()
  }

  /**
   * Builds the mail message with the email contents.
   * This method will render the templates ahead of
   * time
   */
  async buildWithContents(): Promise<void> {
    await this.build()

    if (this.renderedTemplates) {
      return
    }

    await this.message.computeContents()
  }

  /**
   * Sends the mail
   */
  async send<T extends MailerContract<any>>(
    mailer: T,
    config?: Parameters<T['send']>[1]
  ): Promise<Awaited<ReturnType<T['transport']['send']>>> {
    await this.build()
    return mailer.sendCompiled(this.message.toObject(), config)
  }

  /**
   * Sends the mail by using the background
   * messenger
   */
  async sendLater<T extends MailerContract<any>>(
    mailer: T,
    config?: Parameters<T['send']>[1]
  ): Promise<void> {
    await this.build()
    return mailer.sendLaterCompiled(this.message.toObject(), config)
  }
}
