/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EmitterFactory } from '@adonisjs/core/factories/events'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { ViewFactory } from '@adonisjs/view/factories'
import { Application } from '@adonisjs/core/app'

import { SmtpDriver } from '../src/drivers/smtp.js'
import { MailManager } from '../src/mail/mail_manager.js'
import { RecipientNode } from '../src/types/main.js'
import { ManagerDriverFactory } from '../src/define_config.js'

type Config<KnownMailers extends Record<string, ManagerDriverFactory>> = {
  default?: keyof KnownMailers
  list: KnownMailers
}

/**
 * Mail manager factory is used to create an instance of mail manager
 * for testing
 */
export class MailManagerFactory<
  KnownMailers extends Record<string, ManagerDriverFactory> = {
    smtp: () => SmtpDriver
  },
> {
  /**
   * Config accepted by mail manager
   */
  #config: Config<KnownMailers>

  constructor(config?: { default?: keyof KnownMailers; list: KnownMailers; from?: RecipientNode }) {
    const defaultConfig = {
      default: 'smtp',
      list: { smtp: () => new SmtpDriver({ driver: 'smtp', host: 'smtp.io' }) },
    } as unknown as Config<KnownMailers>

    this.#config = config || defaultConfig
  }

  /**
   * Merge factory parameters
   */
  merge<Mailers extends Record<string, ManagerDriverFactory>>(
    config: Config<Mailers>,
  ): MailManagerFactory<Mailers> {
    return new MailManagerFactory(config)
  }

  /**
   * Create mail manager instance
   */
  create(app: Application<any>) {
    return new MailManager<KnownMailers>(
      new ViewFactory().create(),
      new EmitterFactory().create(app),
      new LoggerFactory().create(),
      this.#config,
    )
  }
}
