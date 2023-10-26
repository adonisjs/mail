/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge from 'edge.js'
import { EmitterFactory } from '@adonisjs/core/factories/events'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { Application } from '@adonisjs/core/app'

import { SmtpDriver } from '../src/drivers/smtp/driver.js'
import { MailManager } from '../src/managers/mail_manager.js'
import { RecipientNode } from '../src/types/main.js'
import { MailManagerDriverFactory } from '../src/define_config.js'

type Config<KnownMailers extends Record<string, MailManagerDriverFactory>> = {
  default?: keyof KnownMailers
  mailers: KnownMailers
}

/**
 * Mail manager factory is used to create an instance of mail manager
 * for testing
 */
export class MailManagerFactory<
  KnownMailers extends Record<string, MailManagerDriverFactory> = {
    smtp: () => SmtpDriver
  },
> {
  /**
   * Config accepted by mail manager
   */
  #config: Config<KnownMailers>

  constructor(config?: {
    default?: keyof KnownMailers
    mailers: KnownMailers
    from?: RecipientNode
  }) {
    const defaultConfig = {
      default: 'smtp',
      mailers: { smtp: () => new SmtpDriver({ host: 'smtp.io' }) },
    } as unknown as Config<KnownMailers>

    this.#config = config || defaultConfig
  }

  /**
   * Merge factory parameters
   */
  merge<Mailers extends Record<string, MailManagerDriverFactory>>(
    config: Config<Mailers>
  ): MailManagerFactory<Mailers> {
    return new MailManagerFactory(config)
  }

  /**
   * Create mail manager instance
   */
  create(app: Application<any>) {
    return new MailManager<KnownMailers>(
      edge,
      new EmitterFactory().create(app),
      new LoggerFactory().create(),
      this.#config
    )
  }
}
