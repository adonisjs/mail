/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MailDriverContract, MailDriversList, RecipientNode } from './types/main.js'
import { InvalidArgumentsException } from '@poppinss/utils'
import driversList from './drivers_list.js'

/**
 * Factory function to return the driver implementation. The method
 * cannot be async, because the API that calls this method is not
 * async in first place.
 */
export type ManagerDriverFactory = (config: any) => MailDriverContract

/**
 * Define config for mail
 */
export function defineConfig<
  KnownMailers extends Record<
    string,
    {
      [K in keyof MailDriversList]: { driver: K } & Parameters<MailDriversList[K]>[0]
    }[keyof MailDriversList]
  >
>(config: { default: keyof KnownMailers; list: KnownMailers; from?: RecipientNode }) {
  if (!config.list) {
    throw new InvalidArgumentsException('Missing "list" property inside the mail config')
  }

  if (config.default && !config.list[config.default]) {
    throw new InvalidArgumentsException(
      `"${config.default.toString()}" is not a valid mailer name. Double check the config file`
    )
  }

  const managerMailers = Object.keys(config.list).reduce(
    (result, name: keyof KnownMailers) => {
      const mailerConfig = config.list[name]
      // @ts-ignore
      result[name] = () => driversList.create(mailerConfig.driver, mailerConfig)
      return result
    },
    {} as {
      [K in keyof KnownMailers]: MailDriversList[KnownMailers[K]['driver']]
    }
  )

  return {
    default: config.default,
    list: managerMailers,
    from: config.from,
  }
}
