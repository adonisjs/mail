/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import fastq from 'fastq'

import { Logger } from '@adonisjs/core/logger'
import { Emitter } from '@adonisjs/core/events'
import { RuntimeException } from '@poppinss/utils'
import { ViewContract } from '@adonisjs/view/types'

import { Mailer } from '../mailer.js'
import {
  CompiledMailNode,
  MailerContract,
  MessageComposeCallback,
  QueueMonitorCallback,
  RecipientNode,
} from '../types/main.js'
import debug from '../debug.js'
import { ManagerDriverFactory } from '../define_config.js'
import { BaseMailer } from '../base_mailer.js'
import { FakeMailManager } from './fake_mail_manager.js'
import { FakeDriver } from '../drivers/fake/driver.js'
import { SmtpDriver } from '../drivers/smtp/driver.js'
import { prettyPrint } from '../pretty_print.js'

/**
 * Mail manager config with the list of mailers in
 * use
 */
export class MailManager<KnownMailers extends Record<string, ManagerDriverFactory>> {
  /**
   * List of configured mailers
   */
  #config: {
    default?: keyof KnownMailers
    list: KnownMailers
  }

  /**
   * Global message settings. If set, they will override every
   * message settings.
   */

  #globalSettings: {
    from?: RecipientNode
    to?: RecipientNode[]
  } = {}

  /**
   * Emails queue to scheduling emails to be delivered later
   */
  #emailsQueue = fastq(this, this.#sendQueuedEmail, 10)

  /**
   * Method to monitor in-memory email queue
   */
  #queueMonitor: QueueMonitorCallback = (error) => {
    if (!error) return

    this.logger.error(
      { subject: error.mail.message.subject, message: error.message },
      'Unable to deliver email'
    )
  }

  /**
   * Reference to the fake mailer manager
   */
  #fakeMailManager = new FakeMailManager<KnownMailers>()

  /**
   * Cache of mailers
   */
  #mailersCache: Partial<Record<keyof KnownMailers, Mailer<any, any>>> = {}

  /**
   * Method to pretty print sent emails
   */
  prettyPrint = prettyPrint

  constructor(
    public view: ViewContract,
    public emitter: Emitter<any>,
    public logger: Logger,
    config: { default?: keyof KnownMailers; list: KnownMailers; from?: RecipientNode }
  ) {
    this.#config = config

    if (config.from) {
      this.alwaysFrom(config.from.address, config.from.name)
    }

    BaseMailer.mail = this as any
    debug('creating mail manager. config: %O', this.#config)
  }

  /**
   * Creates an instance of a mail driver
   */
  #createDriver<DriverFactory extends ManagerDriverFactory>(
    factory: DriverFactory
  ): ReturnType<DriverFactory> {
    // @ts-ignore
    return factory()
  }

  /**
   * Sends the email by pulling it from the queue. This method is invoked
   * automatically by fastq.
   */
  async #sendQueuedEmail(
    mail: CompiledMailNode<KnownMailers>,
    cb: (error: null | any, response?: any) => void
  ) {
    try {
      const response = await this.use(mail.mailer).sendCompiled(mail)
      cb(null, { mail, response })
    } catch (error) {
      error.mail = mail
      cb(error)
    }
  }

  use<MailerName extends keyof KnownMailers>(
    mailer?: MailerName
  ): MailerContract<KnownMailers, MailerName> {
    let mailerToUse = mailer || this.getDefaultDriverName()

    if (!mailerToUse) {
      throw new RuntimeException(
        'Cannot create mail instance. No mailer is defined inside the config file'
      )
    }

    if (this.#fakeMailManager.isFaked(mailerToUse)) {
      return this.#fakeMailManager.use(mailerToUse)
    }

    /**
     * Use cached copy if exists
     */
    const cachedMailer = this.#mailersCache[mailerToUse]
    if (cachedMailer) {
      debug('using mailer from cache. name: "%s"', mailerToUse)
      return cachedMailer
    }

    const driverFactory = this.#config.list[mailerToUse]

    if (!driverFactory) {
      throw new RuntimeException(
        `"${mailerToUse.toString()}" is not a valid mailer name. Double check the config file`
      )
    }

    /**
     * Create a new instance of Mailer class with the selected
     * driver and cache it
     */
    debug('creating mail driver. name: "%s"', mailerToUse)
    const mail = new Mailer(mailerToUse, this, true, this.#createDriver(driverFactory))
    this.#mailersCache[mailerToUse] = mail

    return mail as unknown as MailerContract<KnownMailers, MailerName>
  }

  async send(callback: MessageComposeCallback) {
    return this.use().send(callback)
  }

  /**
   * Get the default driver name
   */
  getDefaultDriverName() {
    return this.#config.default
  }

  /**
   * Get messages global settings
   */
  getGlobalSettings() {
    return this.#globalSettings
  }

  /**
   * Method to schedule email for sending. This method is invoked by
   * the mailer when `sendLater` method is called
   */
  scheduleEmail(mail: CompiledMailNode<KnownMailers>) {
    this.#emailsQueue.push(mail, this.#queueMonitor as any)
  }

  /**
   * Fake one or more mailers. Calling the method multiple times
   * appends to the list of faked mailers
   */
  fake(mailers?: keyof KnownMailers | (keyof KnownMailers)[]) {
    mailers = mailers || this.getDefaultDriverName()
    const mailersToFake = Array.isArray(mailers) ? mailers : [mailers]

    mailersToFake.forEach((mailer) => {
      this.#fakeMailManager.fakedMailers.set(
        mailer!,
        new Mailer('fake', this, false, new FakeDriver() as any)
      )
    })

    return this.#fakeMailManager
  }

  /**
   * Define a callback to monitor emails queue
   */
  monitorQueue(callback: QueueMonitorCallback): void {
    this.#queueMonitor = callback
  }

  /**
   * Restore fakes
   */
  restore(mailers?: keyof KnownMailers | (keyof KnownMailers)[]) {
    mailers = mailers || this.getDefaultDriverName()
    const mailersToRestore = Array.isArray(mailers) ? mailers : [mailers]

    mailersToRestore.forEach((mailer) => {
      this.#fakeMailManager.restore(mailer!)
    })
  }

  /**
   * Send email by pushing it to the in-memory queue
   */
  async sendLater(callback: MessageComposeCallback) {
    /**
     * Use fake and return its response
     */
    if (this.#fakeMailManager.isFaked(this.getDefaultDriverName()!)) {
      return this.#fakeMailManager.use(this.getDefaultDriverName()!).send(callback)
    }

    return this.use().sendLater(callback)
  }

  async close(name?: keyof KnownMailers) {
    const mailer = name ? this.use(name) : this.use()
    await mailer.close()
  }

  /**
   * Closes the mapping instance and removes it from the cache
   */
  async closeAll(): Promise<void> {
    const cache = Object.entries(this.#mailersCache)
    await Promise.all(cache.map(([name]) => this.close(name)))
  }

  /**
   * Set the global `to`  email address
   */
  async alwaysTo(address: string, name?: string) {
    this.#globalSettings.to = this.#globalSettings.to || []
    this.#globalSettings.to.push({ address, name })

    return this
  }

  /**
   * Set the global `from` email address
   */
  async alwaysFrom(address: string, name?: string) {
    this.#globalSettings.from = { address, name }

    return this
  }

  /**
   * Sends email to the ethereal email account. This is great
   * for previewing emails
   */
  async preview(callback: MessageComposeCallback) {
    const account = await nodemailer.createTestAccount()

    const smtpDriver = new SmtpDriver({
      driver: 'smtp',
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { type: 'login', user: account.user, pass: account.pass },
    })

    const mailer = new Mailer('ethereal', this, true, smtpDriver as any)
    const response: SMTPTransport.SentMessageInfo = await mailer.send(callback)
    const url = nodemailer.getTestMessageUrl(response)

    return {
      ...response,
      url,
      account: { user: account.user, pass: account.pass },
      toIframe: () => `<iframe src="${url}" width="100%" height="100%"></iframe>`,
    }
  }
}
