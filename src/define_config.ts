/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import { InvalidArgumentsException } from '@poppinss/utils'
import type { ConfigProvider } from '@adonisjs/core/types'
import type { MailDriverContract, RecipientNode } from './types/main.js'
import type { BrevoConfig } from './drivers/brevo/types.js'
import type { BrevoDriver } from './drivers/brevo/driver.js'
import type { MailgunConfig } from './drivers/mailgun/types.js'
import type { MailgunDriver } from './drivers/mailgun/driver.js'
import type { ResendConfig } from './drivers/resend/types.js'
import type { ResendDriver } from './drivers/resend/driver.js'
import type { SesConfig } from './drivers/ses/types.js'
import type { SesDriver } from './drivers/ses/driver.js'
import type { SmtpConfig } from './drivers/smtp/types.js'
import type { SmtpDriver } from './drivers/smtp/driver.js'
import type { SparkPostConfig } from './drivers/sparkpost/types.js'
import type { SparkPostDriver } from './drivers/sparkpost/driver.js'

/**
 * Shape of config after it has been resolved from
 * the config provider
 */
type ResolvedMailers<
  KnownMailers extends Record<
    string,
    MailManagerDriverFactory | ConfigProvider<MailManagerDriverFactory>
  >,
> = {
  [K in keyof KnownMailers]: KnownMailers[K] extends ConfigProvider<infer A> ? A : KnownMailers[K]
}

/**
 * Factory function to return the driver implementation. The method
 * cannot be async, because the API that calls this method is not
 * async in first place.
 */
export type MailManagerDriverFactory = () => MailDriverContract

/**
 * Define config for mail
 */
export function defineConfig<
  KnownMailers extends Record<
    string,
    MailManagerDriverFactory | ConfigProvider<MailManagerDriverFactory>
  >,
>(config: {
  default: keyof KnownMailers
  mailers: KnownMailers
  from?: RecipientNode
}): ConfigProvider<{
  default: keyof KnownMailers
  mailers: ResolvedMailers<KnownMailers>
  from?: RecipientNode
}> {
  return configProvider.create(async (app) => {
    if (!config.mailers) {
      throw new InvalidArgumentsException('Missing "mailers" property inside the mail config')
    }

    if (config.default && !config.mailers[config.default]) {
      throw new InvalidArgumentsException(
        `"mailers.${config.default.toString()}" is not a valid mailer name. Double check the config file`
      )
    }

    const mailersNames = Object.keys(config.mailers)
    const mailers = {} as Record<string, MailManagerDriverFactory>

    for (let mailerName of mailersNames) {
      const mailer = config.mailers[mailerName]

      if (typeof mailer === 'function') {
        mailers[mailerName] = mailer
      } else {
        mailers[mailerName] = await mailer.resolver(app)
      }
    }

    return {
      default: config.default,
      mailers: mailers as ResolvedMailers<KnownMailers>,
      from: config.from,
    }
  })
}

export const mailers: {
  ses: (config: SesConfig) => ConfigProvider<() => SesDriver>
  smtp: (config: SmtpConfig) => ConfigProvider<() => SmtpDriver>
  mailgun: (config: MailgunConfig) => ConfigProvider<() => MailgunDriver>
  sparkpost: (config: SparkPostConfig) => ConfigProvider<() => SparkPostDriver>
  brevo: (config: BrevoConfig) => ConfigProvider<() => BrevoDriver>
  resend: (config: ResendConfig) => ConfigProvider<() => ResendDriver>
} = {
  ses(config) {
    return configProvider.create(async () => {
      const { SesDriver } = await import('../src/drivers/ses/driver.js')
      return () => new SesDriver(config)
    })
  },
  smtp(config) {
    return configProvider.create(async () => {
      const { SmtpDriver } = await import('../src/drivers/smtp/driver.js')
      return () => new SmtpDriver(config)
    })
  },
  mailgun(config) {
    return configProvider.create(async (app) => {
      const logger = await app.container.make('logger')
      const { MailgunDriver } = await import('../src/drivers/mailgun/driver.js')
      return () => new MailgunDriver(config, logger)
    })
  },
  sparkpost(config) {
    return configProvider.create(async (app) => {
      const logger = await app.container.make('logger')
      const { SparkPostDriver } = await import('../src/drivers/sparkpost/driver.js')
      return () => new SparkPostDriver(config, logger)
    })
  },
  brevo(config) {
    return configProvider.create(async (app) => {
      const logger = await app.container.make('logger')
      const { BrevoDriver } = await import('../src/drivers/brevo/driver.js')
      return () => new BrevoDriver(config, logger)
    })
  },
  resend(config) {
    return configProvider.create(async (app) => {
      const logger = await app.container.make('logger')
      const { ResendDriver } = await import('../src/drivers/resend/driver.js')
      return () => new ResendDriver(config, logger)
    })
  },
}
