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
import {
  MailerConfig,
  MailerMessenger,
  NodeMailerMessage,
  MailDriverContract,
  MessageBodyTemplates,
  MailerTemplateEngine,
  MessageComposeCallback,
} from './types.js'
import { MemoryQueueMessenger } from './messengers/memory_queue.js'

export class Mailer<Driver extends MailDriverContract> {
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
    config: MailerConfig
  ) {
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
        'Cannot render templates without a template engine. Make sure to call "mailer.setTemplateEngine" first'
      )
    }

    return this.#templateEngine
  }

  /**
   * Set the email contents by rendering the views. Views are only
   * rendered when inline values are not defined.
   */
  async #setEmailContent({
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
   * Sends a compiled email using the underlying driver
   */
  async sendCompiled(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ) {
    /**
     * Mutates the "compiledMessage.message" object based upon
     * the configured templates
     */
    await this.#setEmailContent(mail)

    /**
     * Send the message using the driver
     */
    return this.driver.send(mail.message, sendConfig) as Promise<ReturnType<Driver['send']>>
  }

  /**
   * Sends email
   */
  async send(
    callback: MessageComposeCallback,
    config?: Parameters<Driver['send']>[1]
  ): Promise<ReturnType<Driver['send']>> {
    const message = new Message()

    /**
     * Set the default from address, the user can override it
     * inside the callback
     */
    if (this.#config.from) {
      message.from(this.#config.from)
    }

    /**
     * Invoke callback to configure the mail message
     */
    await callback(message)

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
    callback: MessageComposeCallback,
    config?: Parameters<Driver['send']>[1]
  ): Promise<void> {
    const message = new Message()

    /**
     * Set the default from address, the user can override it
     * inside the callback
     */
    if (this.#config.from) {
      message.from(this.#config.from)
    }

    /**
     * Invoke callback to configure the mail message
     */
    await callback(message)

    /**
     * Compile the message to an object
     */
    const compiledMessage = message.toObject()

    /**
     * Queuing email
     */
    this.#messenger?.queue(compiledMessage, config)
  }

  /**
   * Invokes `close` method on the driver
   */
  async close() {
    await this.driver.close()
  }
}
