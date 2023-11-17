/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import type { ConfigProvider } from '@adonisjs/core/types'

import type { SESDriver } from './drivers/ses/main.js'
import type { SMTPDriver } from './drivers/smtp/main.js'
import type { ResendDriver } from './drivers/resend/main.js'
import type { MailgunDriver } from './drivers/mailgun/main.js'
import type { SparkPostDriver } from './drivers/sparkpost/main.js'
import type {
  SESConfig,
  SMTPConfig,
  MailerConfig,
  ResendConfig,
  MailgunConfig,
  SparkPostConfig,
  MailManagerDriverFactory,
} from './types.js'

/**
 * Helper to remap known mailers to factory functions
 */
type ResolvedConfig<KnownMailers extends Record<string, MailManagerDriverFactory>> =
  MailerConfig & {
    default?: keyof KnownMailers
    mailers: {
      [K in keyof KnownMailers]: KnownMailers[K] extends ConfigProvider<infer A>
        ? A
        : KnownMailers[K]
    }
  }

/**
 * Helper function to define config for the mail
 * service
 */
export function defineConfig<KnownMailers extends Record<string, MailManagerDriverFactory>>(
  config: MailerConfig & {
    default?: keyof KnownMailers
    mailers: {
      [K in keyof KnownMailers]: ConfigProvider<KnownMailers[K]> | KnownMailers[K]
    }
  }
): ConfigProvider<ResolvedConfig<KnownMailers>> {
  return configProvider.create(async (app) => {
    const { mailers, default: defaultMailer, ...rest } = config
    const mailersNames = Object.keys(mailers)
    const drivers = {} as Record<string, MailManagerDriverFactory>

    for (let mailerName of mailersNames) {
      const mailerDriver = mailers[mailerName]
      if (typeof mailerDriver === 'function') {
        drivers[mailerName] = mailerDriver
      } else {
        drivers[mailerName] = await mailerDriver.resolver(app)
      }
    }

    return {
      default: defaultMailer,
      mailers: drivers,
      ...rest,
    } as ResolvedConfig<KnownMailers>
  })
}

/**
 * Config helpers to create a reference for inbuilt
 * mail drivers
 */
export const drivers: {
  smtp: (config: SMTPConfig) => ConfigProvider<() => SMTPDriver>
  ses: (config: SESConfig) => ConfigProvider<() => SESDriver>
  mailgun: (config: MailgunConfig) => ConfigProvider<() => MailgunDriver>
  sparkpost: (config: SparkPostConfig) => ConfigProvider<() => SparkPostDriver>
  resend: (config: ResendConfig) => ConfigProvider<() => ResendDriver>
} = {
  smtp(config) {
    return configProvider.create(async () => {
      const { SMTPDriver } = await import('./drivers/smtp/main.js')
      return () => new SMTPDriver(config)
    })
  },
  ses(config) {
    return configProvider.create(async () => {
      const { SESDriver } = await import('./drivers/ses/main.js')
      return () => new SESDriver(config)
    })
  },
  mailgun(config) {
    return configProvider.create(async () => {
      const { MailgunDriver } = await import('./drivers/mailgun/main.js')
      return () => new MailgunDriver(config)
    })
  },
  sparkpost(config) {
    return configProvider.create(async () => {
      const { SparkPostDriver } = await import('./drivers/sparkpost/main.js')
      return () => new SparkPostDriver(config)
    })
  },
  resend(config) {
    return configProvider.create(async () => {
      const { ResendDriver } = await import('./drivers/resend/main.js')
      return () => new ResendDriver(config)
    })
  },
}
