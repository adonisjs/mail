/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MailDrivers } from '@ioc:Adonis/Addons/Mail'

/**
 * Expected shape of the config accepted by the "mailConfig"
 * method
 */
type MailConfig = {
  mailers: {
    [name: string]: {
      [K in keyof MailDrivers]: MailDrivers[K]['config'] & { driver: K }
    }[keyof MailDrivers]
  }
}

/**
 * Define config for mail
 */
export function mailConfig<T extends MailConfig & { mailer: keyof T['mailers'] }>(config: T): T {
  return config
}

/**
 * Pull mailers from the config defined inside the "config/mail.ts"
 * file
 */
export type InferMailersFromConfig<T extends MailConfig> = {
  [K in keyof T['mailers']]: MailDrivers[T['mailers'][K]['driver']]
}
