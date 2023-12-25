/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { EmitterLike } from '@adonisjs/core/types/events'

import debug from './debug.js'
import { Message } from './message.js'
import { BaseMail } from './base_mail.js'
import { MemoryQueueMessenger } from './messengers/memory_queue.js'
import type {
  MailEvents,
  MailerConfig,
  MailerContract,
  MailerMessenger,
  NodeMailerMessage,
  MailTransportContract,
  MessageBodyTemplates,
  MessageComposeCallback,
} from './types.js'

/**
 * The Mailer acts as an adapter that wraps a transport and exposes
 * consistent API for sending and queueing emails
 */
export class Mailer<Transport extends MailTransportContract> implements MailerContract<Transport> {
  /**
   * Reference to AdonisJS application emitter
   */
  #emitter: EmitterLike<MailEvents>

  /**
   * Messenger to use for queuing emails
   */
  #messenger: MailerMessenger

  constructor(
    public name: string,
    public transport: Transport,
    emitter: EmitterLike<MailEvents>,
    public config: MailerConfig = {}
  ) {
    this.#emitter = emitter
    this.#messenger = new MemoryQueueMessenger(this, this.#emitter)
  }

  /**
   * Configure the messenger to use for sending email asynchronously
   */
  setMessenger(messenger: MailerMessenger): this {
    this.#messenger = messenger
    return this
  }

  /**
   * Sends a compiled email using the underlying transport
   */
  async sendCompiled(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ): Promise<Awaited<ReturnType<Transport['send']>>> {
    /**
     * Use the global from address when no from address
     * is defined on the mail
     */
    if (!mail.message.from && this.config.from) {
      mail.message.from = this.config.from
    }

    /**
     * Use the global from address when no from address
     * is defined on the mail
     */
    if (!mail.message.replyTo && this.config.replyTo) {
      mail.message.replyTo = [this.config.replyTo]
    }

    /**
     * Notify, about to send the email
     */
    this.#emitter.emit('mail:sending', {
      ...mail,
      mailerName: this.name,
    })

    /**
     * Mutates the "compiledMessage.message" object based upon
     * the configured templates
     */
    await Message.computeContentsFor(mail)

    /**
     * Send the message using the transport
     */
    debug('sending email, subject "%s"', mail.message.subject)
    const response = await this.transport.send(mail.message, sendConfig)
    debug('email sent, message id "%s"', response.messageId)

    /**
     * Notify, email has been sent
     */
    this.#emitter.emit('mail:sent', {
      ...mail,
      mailerName: this.name,
      response,
    })

    return response as Awaited<ReturnType<Transport['send']>>
  }

  /**
   * Queues a compiled email
   */
  async sendLaterCompiled(
    compiledMessage: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ) {
    /**
     * Notify, we are queueing the email
     */
    this.#emitter.emit('mail:queueing', {
      ...compiledMessage,
      mailerName: this.name,
    })

    /**
     * Queuing email
     */
    debug('queueing email')
    const metaData = await this.#messenger.queue(compiledMessage, sendConfig)

    /**
     * Notify, the email has been queued
     */
    this.#emitter.emit('mail:queued', {
      ...compiledMessage,
      metaData,
      mailerName: this.name,
    })
  }

  /**
   * Sends email
   */
  async send(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: Parameters<Transport['send']>[1]
  ): Promise<Awaited<ReturnType<Transport['send']>>> {
    if (callbackOrMail instanceof BaseMail) {
      return callbackOrMail.send(this, config)
    }

    const message = new Message()

    /**
     * Set the default from address, the user can override it
     * inside the callback
     */
    if (this.config.from) {
      typeof this.config.from === 'string'
        ? message.from(this.config.from)
        : message.from(this.config.from.address, this.config.from.name)
    }

    /**
     * Invoke callback to configure the mail message
     */
    await callbackOrMail(message)

    /**
     * Compile the message to an object
     */
    const compiledMessage = message.toObject()
    return this.sendCompiled(compiledMessage, config)
  }

  /**
   * Send an email asynchronously using the mail messenger. The
   * default messenger uses an in-memory queue, unless you have
   * configured a custom messenger.
   */
  async sendLater(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: Parameters<Transport['send']>[1]
  ): Promise<void> {
    if (callbackOrMail instanceof BaseMail) {
      return callbackOrMail.sendLater(this, config)
    }

    const message = new Message()

    /**
     * Invoke callback to configure the mail message
     */
    await callbackOrMail(message)

    /**
     * Compile the message to an object
     */
    const compiledMessage = message.toObject()
    return this.sendLaterCompiled(compiledMessage, config)
  }

  /**
   * Invokes `close` method on the transport
   */
  async close() {
    await this.transport.close?.()
  }
}
