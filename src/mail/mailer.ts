/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Message } from '../message/index.js'
import { MailManager } from './mail_manager.js'
import { ManagerDriverFactory } from '../define_config.js'
import {
  CompiledMailNode,
  DriverOptionsType,
  MailerContract,
  MailerResponseType,
  MessageComposeCallback,
} from '../types/main.js'

export class Mailer<
  KnownMailers extends Record<string, ManagerDriverFactory>,
  Name extends keyof KnownMailers,
> implements MailerContract<KnownMailers, Name>
{
  #driverOptions?: DriverOptionsType<ReturnType<KnownMailers[Name]>>

  #useQueue: boolean

  constructor(
    public name: Name,
    public manager: MailManager<KnownMailers>,
    useQueue: boolean,

    public driver: ReturnType<KnownMailers[Name]>
  ) {
    this.#useQueue = useQueue
  }

  /**
   * Ensure "@adonisjs/view" is installed
   */
  #ensureView(methodName: string) {
    if (!this.manager.view) {
      throw new Error(`"@adonisjs/view" must be installed before using "message.${methodName}"`)
    }
  }

  /**
   * Set the email contents by rendering the views. Views are only
   * rendered when inline values are not defined.
   */
  async #setEmailContent({ message, views }: CompiledMailNode<KnownMailers>) {
    if (!message.html && views.html) {
      this.#ensureView('htmlView')
      message.html = await this.manager.view!.render(views.html.template, views.html.data)
    }

    if (!message.text && views.text) {
      this.#ensureView('textView')
      message.text = await this.manager.view!.render(views.text.template, views.text.data)
    }

    if (!message.watch && views.watch) {
      this.#ensureView('watchView')
      message.watch = await this.manager.view!.render(views.watch.template, views.watch.data)
    }
  }

  /**
   * Override mail node settings with global settings
   */
  #setGlobalSettings(message: CompiledMailNode<KnownMailers>) {
    const globalSettings = this.manager.getGlobalSettings()

    if (globalSettings.from) {
      message.message.from = globalSettings.from
    }

    if (globalSettings.to) {
      message.message.to = globalSettings.to
    }
  }

  /**
   * Sends email using a pre-compiled message. You should use [[MailerContract.send]], unless
   * you are pre-compiling messages yourself
   */
  async sendCompiled(mail: CompiledMailNode<KnownMailers>) {
    /**
     * Set content by rendering views
     */
    await this.#setEmailContent(mail)

    /**
     * run afterCompile hooks
     */
    await this.manager.hooks.runner('afterCompile').run(this.name, mail)

    /**
     * Set global `from` and `to` when defined
     */
    this.#setGlobalSettings(mail)

    /**
     * Send email for real
     */
    const response = await this.driver.send(mail.message, mail.config)

    /**
     * Emit event
     */
    this.manager.emitter.emit('mail:sent', {
      message: mail.message,
      // @ts-ignore
      views: Object.keys(mail.views).map((view) => mail.views[view].template),
      mailer: mail.mailer,
      response: response,
    })

    return response as unknown as Promise<MailerResponseType<Name, KnownMailers>>
  }

  /**
   * Define options to be forwarded to the underlying driver
   */
  options(options: DriverOptionsType<ReturnType<KnownMailers[Name]>>): this {
    this.#driverOptions = options
    return this
  }

  /**
   * Sends email
   */
  async send(callback: MessageComposeCallback, config?: DriverOptionsType<KnownMailers[Name]>) {
    const message = new Message(false)
    await callback(message)

    const compiledMessage = message.toJSON()
    return this.sendCompiled({
      message: compiledMessage.message,
      views: compiledMessage.views,
      mailer: this.name,
      config: config || this.#driverOptions,
    })
  }

  /**
   * Send email later by queuing it inside an in-memory queue
   */
  async sendLater(
    callback: MessageComposeCallback,
    config?: DriverOptionsType<KnownMailers[Name]>
  ) {
    if (!this.#useQueue) {
      await this.send(callback, config)
      return
    }

    const message = new Message(true)
    await callback(message)

    const compiledMessage = message.toJSON()
    return this.manager.scheduleEmail({
      message: compiledMessage.message,
      views: compiledMessage.views,
      mailer: this.name,
      config: config || this.#driverOptions,
    })
  }

  /**
   * Invokes `close` method on the driver
   */
  async close() {
    await this.driver.close()
  }
}
