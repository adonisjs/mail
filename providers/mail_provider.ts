/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationService } from '@adonisjs/core/types'

import driversList from '../src/drivers_list.js'
import { SesDriver } from '../src/drivers/ses.js'
import { SmtpDriver } from '../src/drivers/smtp.js'
import { SparkPostDriver } from '../src/drivers/sparkpost.js'
import { MailgunDriver } from '../src/drivers/mailgun.js'
import { BrevoDriver } from '../src/drivers/brevo.js'
import { ResendDriver } from '../src/drivers/resend.js'
import { defineReplBindings } from '../src/bindings.js'

/**
 * Mail provider to register mail specific bindings
 */
export default class MailProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register built-in mailers in the driversList
   */
  async #registerDrivers() {
    const logger = await this.app.container.make('logger')

    driversList.extend('ses', (config) => new SesDriver(config))
    driversList.extend('smtp', (config) => new SmtpDriver(config))
    driversList.extend('mailgun', (config) => new MailgunDriver(config, logger))
    driversList.extend('sparkpost', (config) => new SparkPostDriver(config, logger))
    driversList.extend('brevo', (config) => new BrevoDriver(config, logger))
    driversList.extend('resend', (config) => new ResendDriver(config, logger))
  }

  /**
   * Register mail manager singleton
   */
  #registerMailManager() {
    this.app.container.singleton('mail', async () => {
      const { MailManager } = await import('../src/mail/mail_manager.js')

      const logger = await this.app.container.make('logger')
      const view = await this.app.container.make('view')
      const emitter = await this.app.container.make('emitter')

      const config = this.app.config.get<any>('mail', {})
      return new MailManager(view, emitter, logger, config)
    })
  }

  /**
   * Register REPL bindings
   */
  async #registerReplBindings() {
    if (this.app.getEnvironment() !== 'repl') {
      return
    }

    const repl = await this.app.container.make('repl')
    defineReplBindings(this.app, repl)
  }

  /**
   * Registers bindings
   */
  async register() {
    this.#registerMailManager()
    this.#registerReplBindings()
  }

  /**
   * Register drivers
   */
  async boot() {
    await this.#registerDrivers()
  }

  /**
   * Close all drivers when shutting down the app
   */
  async shutdown() {
    const mail = await this.app.container.make('mail')
    await mail.closeAll()
  }
}
