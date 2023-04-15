/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import fastq from 'fastq'
import nodemailer from 'nodemailer'
import { Manager } from '@poppinss/manager'
import { ManagerConfigValidator } from '@poppinss/utils'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import {
  MailConfig,
  MailersList,
  MailerContract,
  CompiledMailNode,
  MailDriverContract,
  QueueMonitorCallback,
  MailManagerContract,
  MessageComposeCallback,
} from '@ioc:Adonis/Addons/Mail'

import { Mailer } from './Mailer'
import { FakeMailManager } from '../Fake'
import { BaseMailer } from '../BaseMailer'
import { prettyPrint } from '../Helpers/prettyPrint'

/**
 * The manager exposes the API to pull instance of [[Mailer]] class for pre-defined mappings
 * in the config file. The manager internally manages the state of mappings and cache
 * them for re-use.
 */
export class MailManager
  extends Manager<
    ApplicationContract,
    MailDriverContract,
    MailerContract<keyof MailersList>,
    {
      [P in keyof MailersList]: MailerContract<keyof MailersList>
    }
  >
  implements MailManagerContract
{
  /**
   * Emails queue to scheduling emails to be delivered later
   */
  private emailsQueue = fastq(this, this.sendQueuedEmail, 10)

  /**
   * Method to monitor in-memory email queue
   */
  private queueMonitor: QueueMonitorCallback = (error) => {
    if (error) {
      this.logger.error(
        {
          subject: error.mail.message.subject,
          message: error.message,
        },
        'Unable to deliver email'
      )
    }
  }

  /**
   * Reference to the fake mailer manager
   */
  private fakeMailManager = new FakeMailManager()

  /**
   * Caching driver instances. One must call `close` to clean it up
   */
  protected singleton = true

  /**
   * Method to pretty print sent emails
   */
  public prettyPrint = prettyPrint

  /**
   * Reference to the base mailer since Ioc container doesn't allow
   * multiple exports
   */
  public BaseMailer = BaseMailer

  /**
   * Dependencies from the "@adonisjs/core" and "@adonisjs/view". The manager classes
   * in AdonisJS codebase heavily relies on the container and hence we can pull
   * container bindings directly here.
   */
  public view = this.app.container.hasBinding('Adonis/Core/View')
    ? this.app.container.use('Adonis/Core/View')
    : undefined

  public emitter = this.app.container.use('Adonis/Core/Event')
  public logger = this.app.container.use('Adonis/Core/Logger')
  public profiler = this.app.container.use('Adonis/Core/Profiler')

  constructor(private app: ApplicationContract, private config: MailConfig) {
    super(app)
    this.BaseMailer.mail = this
    this.validateConfig()
  }

  /**
   * Validate config at runtime
   */
  private validateConfig() {
    const validator = new ManagerConfigValidator(this.config, 'mail', 'config/mail')
    validator.validateDefault('mailer')
    validator.validateList('mailers', 'mailer')
  }

  /**
   * Sends the email by pulling it from the queue. This method is invoked
   * automatically by fastq.
   */
  private async sendQueuedEmail(
    mail: CompiledMailNode,
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

  /**
   * Creates and returns an ethereal email account. Node mailer internally
   * ensures only a single email account is created and hence we don't
   * have to worry about caching credentials.
   */
  private getEtherealAccount(): Promise<any> {
    return new Promise((resolve, reject) => {
      nodemailer.createTestAccount((error: Error, account: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(account)
        }
      })
    })
  }

  /**
   * Since we don't expose the drivers instances directly, we wrap them
   * inside the mailer instance.
   */
  protected wrapDriverResponse<Name extends keyof MailersList>(
    mappingName: Name,
    driver: MailDriverContract
  ): MailerContract<Name> {
    return new Mailer(mappingName, this, true, driver)
  }

  /**
   * Returns the driver name for a given mapping
   */
  protected getMappingDriver(name: string) {
    const config = this.getMappingConfig(name)
    return config && config.driver
  }

  /**
   * Returns the config for a given mapping
   */
  protected getMappingConfig(name: string) {
    return this.config.mailers[name]
  }

  /**
   * Returns the name of the default mapping
   */
  protected getDefaultMappingName() {
    return this.config.mailer
  }

  /**
   * Creates an instance of `smtp` driver by lazy loading. This method
   * is invoked internally when a new driver instance is required
   */
  protected createSmtp(_: string, config: any) {
    const { SmtpDriver } = require('../Drivers/Smtp')
    return new SmtpDriver(config)
  }

  /**
   * Creates an instance of `ses` driver by lazy loading. This method
   * is invoked internally when a new driver instance is required
   */
  protected createSes(_: string, config: any) {
    const { SesDriver } = require('../Drivers/Ses')
    return new SesDriver(config)
  }

  /**
   * Creates an instance of `mailgun` driver by lazy loading. This method
   * is invoked internally when a new driver instance is required
   */
  protected createMailgun(_: string, config: any) {
    const { MailgunDriver } = require('../Drivers/Mailgun')
    return new MailgunDriver(config, this.logger)
  }

  /**
   * Creates an instance of `sparkpost` driver by lazy loading. This method
   * is invoked internally when a new driver instance is required
   */
  protected createSparkpost(_: string, config: any) {
    const { SparkPostDriver } = require('../Drivers/SparkPost')
    return new SparkPostDriver(config, this.logger)
  }

  /**
   * Creates an instance of `file` driver by lazy loading. This method
   * is invoked internally when a new driver instance is required
   */
  protected createFile(_: string) {
    const { FileDriver } = require('../Drivers/File')
    return new FileDriver()
  }

  /**
   * Method to schedule email for sending. This method is invoked by
   * the mailer when `sendLater` method is called
   */
  public scheduleEmail(mail: CompiledMailNode) {
    this.emailsQueue.push(mail, this.queueMonitor as any)
  }

  /**
   * Fake one or more mailers. Calling the method multiple times
   * appends to the list of faked mailers
   */
  public fake(mailers?: keyof MailersList | (keyof MailersList)[]) {
    mailers = mailers || this.getDefaultMappingName()
    const mailersToFake = Array.isArray(mailers) ? mailers : [mailers]

    const { FakeDriver } = require('../Drivers/Fake')
    mailersToFake.forEach((mailer) => {
      this.fakeMailManager.fakedMailers.set(
        mailer,
        new Mailer('fake' as any, this, false, new FakeDriver())
      )
    })

    return this.fakeMailManager
  }

  /**
   * Define a callback to monitor emails queue
   */
  public monitorQueue(callback: QueueMonitorCallback): void {
    this.queueMonitor = callback
  }

  /**
   * Restore fakes
   */
  public restore(mailers?: keyof MailersList | (keyof MailersList)[]) {
    mailers = mailers || this.getDefaultMappingName()
    const mailersToRestore = Array.isArray(mailers) ? mailers : [mailers]

    mailersToRestore.forEach((mailer) => {
      this.fakeMailManager.restore(mailer)
    })
  }

  /**
   * Sends email using the default `mailer`
   */
  public async send(callback: MessageComposeCallback) {
    /**
     * Use fake and return its response
     */
    if (this.fakeMailManager.isFaked(this.getDefaultMappingName())) {
      return this.fakeMailManager.use(this.getDefaultMappingName()).send(callback)
    }

    return this.use().send(callback)
  }

  /**
   * Send email by pushing it to the in-memory queue
   */
  public async sendLater(callback: MessageComposeCallback) {
    /**
     * Use fake and return its response
     */
    if (this.fakeMailManager.isFaked(this.getDefaultMappingName())) {
      return this.fakeMailManager.use(this.getDefaultMappingName()).send(callback)
    }

    return this.use().sendLater(callback)
  }

  /**
   * Use a named or the default mailer
   */
  public use(name?: keyof MailersList) {
    name = name || this.getDefaultMappingName()

    /**
     * Use fake
     */
    if (this.fakeMailManager.isFaked(name)) {
      return this.fakeMailManager.use(name)
    }

    return super.use(name)
  }

  /**
   * Closes the mapping instance and removes it from the cache
   */
  public async close(name?: keyof MailersList): Promise<void> {
    const mailer = name ? this.use(name) : this.use()
    await mailer.close()
  }

  /**
   * Closes the mapping instance and removes it from the cache
   */
  public async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this['mappingsCache'].keys()).map((name: string) => this.close(name as any))
    )
  }

  /**
   * Sends email to the ethereal email account. This is great
   * for previewing emails
   */
  public async preview(callback: MessageComposeCallback) {
    const account = await this.getEtherealAccount()
    const mappingName: any = 'ethereal'

    const smtpDriver = this.createSmtp(mappingName, {
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    })

    const mailer = this.wrapDriverResponse(mappingName, smtpDriver)
    const response = await mailer.send(callback)

    return {
      ...response,
      url: nodemailer.getTestMessageUrl(response),
      account: {
        user: account.user,
        pass: account.pass,
      },
    }
  }
}
