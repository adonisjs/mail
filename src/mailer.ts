/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RuntimeException } from '@poppinss/utils'

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
  MailDriverContract,
  MessageBodyTemplates,
  MailerTemplateEngine,
  MessageComposeCallback,
} from './types.js'
import { Emitter } from '@adonisjs/core/events'

/**
 * The Mailer acts as an adapter that wraps a driver and exposes
 * consistent API for sending and queueing emails
 */
export class Mailer<Driver extends MailDriverContract> implements MailerContract<Driver> {
  /**
   * Reference to AdonisJS application emitter
   */
  #emitter: Emitter<MailEvents>

  /**
   * Mailer config
   */
  #config: MailerConfig

  /**
   * Optional template engine to use for rendering
   * templates
   */
  #templateEngine?: MailerTemplateEngine

  /**
   * Messenger to use for queuing emails
   */
  #messenger: MailerMessenger = new MemoryQueueMessenger(this)

  constructor(
    public name: string,
    public driver: Driver,
    emitter: Emitter<MailEvents>,
    config: MailerConfig
  ) {
    this.#emitter = emitter
    this.#config = config
  }

  /**
   * Returns the configured template engine object or
   * throws an error when no template engine is
   * configured
   */
  #getTemplateEngine() {
    if (!this.#templateEngine) {
      throw new RuntimeException(
        'Cannot render templates without a template engine. Make sure to call the "mailer.setTemplateEngine" method first'
      )
    }

    return this.#templateEngine
  }

  /**
   * Configure the template engine to use for rendering
   * email templates
   */
  setTemplateEngine(engine: MailerTemplateEngine): this {
    this.#templateEngine = engine
    return this
  }

  /**
   * Configure the messenger to use for sending email asynchronously
   */
  setMessenger(messenger: MailerMessenger): this {
    this.#messenger = messenger
    return this
  }

  /**
   * Precomputes the contents of a message by rendering the email
   * views
   */
  async preComputeContents(message: Message) {
    if (!message.nodeMailerMessage.html && message.contentViews.html) {
      message.html(
        await this.#getTemplateEngine().render(
          message.contentViews.html.template,
          message.contentViews.html.data
        )
      )
    }

    if (!message.nodeMailerMessage.text && message.contentViews.text) {
      message.text(
        await this.#getTemplateEngine().render(
          message.contentViews.text.template,
          message.contentViews.text.data
        )
      )
    }

    if (!message.nodeMailerMessage.watch && message.contentViews.watch) {
      message.watch(
        await this.#getTemplateEngine().render(
          message.contentViews.watch.template,
          message.contentViews.watch.data
        )
      )
    }
  }

  /**
   * Defines the email contents by rendering the views. Views are only
   * rendered when inline values are not defined.
   */
  async defineEmailContent({
    message,
    views,
  }: {
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }) {
    if (!message.html && views.html) {
      debug('computing mail html contents %O', views.html)
      message.html = await this.#getTemplateEngine().render(views.html.template, views.html.data)
    }

    if (!message.text && views.text) {
      debug('computing mail text contents %O', views.text)
      message.text = await this.#getTemplateEngine().render(views.text.template, views.text.data)
    }

    if (!message.watch && views.watch) {
      debug('computing mail watch contents %O', views.watch)
      message.watch = await this.#getTemplateEngine().render(views.watch.template, views.watch.data)
    }
  }

  /**
   * Sends a compiled email using the underlying driver
   */
  async sendCompiled(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ): Promise<Awaited<ReturnType<Driver['send']>>> {
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
    await this.defineEmailContent(mail)

    /**
     * Send the message using the driver
     */
    debug('sending email, subject "%s"', mail.message.subject)
    const response = await this.driver.send(mail.message, sendConfig)
    debug('email sent, message id "%s"', response.messageId)

    /**
     * Notify, email has been sent
     */
    this.#emitter.emit('mail:sent', {
      ...mail,
      mailerName: this.name,
      response,
    })

    return response as Awaited<ReturnType<Driver['send']>>
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
    await this.#messenger.queue(compiledMessage, sendConfig)

    /**
     * Notify, the email has been queued
     */
    this.#emitter.emit('mail:queued', {
      ...compiledMessage,
      mailerName: this.name,
    })
  }

  /**
   * Sends email
   */
  async send(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: Parameters<Driver['send']>[1]
  ): Promise<Awaited<ReturnType<Driver['send']>>> {
    if (callbackOrMail instanceof BaseMail) {
      return callbackOrMail.send(this, config)
    }

    const message = new Message()

    /**
     * Set the default from address, the user can override it
     * inside the callback
     */
    if (this.#config.from) {
      typeof this.#config.from === 'string'
        ? message.from(this.#config.from)
        : message.from(this.#config.from.address, this.#config.from.name)
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
    config?: Parameters<Driver['send']>[1]
  ): Promise<void> {
    if (callbackOrMail instanceof BaseMail) {
      return callbackOrMail.sendLater(this, config)
    }

    const message = new Message()

    /**
     * Set the default from address, the user can override it
     * inside the callback
     */
    if (this.#config.from) {
      typeof this.#config.from === 'string'
        ? message.from(this.#config.from)
        : message.from(this.#config.from.address, this.#config.from.name)
    }

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
   * Invokes `close` method on the driver
   */
  async close() {
    await this.driver.close()
  }
}
