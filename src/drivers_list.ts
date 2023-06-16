/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RuntimeException } from '@poppinss/utils'
import { MailDriversList } from './types/main.js'

/**
 * A global collection of Mail drivers
 */
class MailDriversCollection {
  /**
   * List of registered drivers
   */
  list: Partial<MailDriversList> = {}

  /**
   * Extend drivers collection and add a custom
   * driver to it.
   */
  extend<Name extends keyof MailDriversList>(
    driverName: Name,
    factoryCallback: MailDriversList[Name],
  ): this {
    this.list[driverName] = factoryCallback
    return this
  }

  /**
   * Creates the driver instance with config
   */
  create<Name extends keyof MailDriversList>(
    name: Name,
    config: Parameters<MailDriversList[Name]>[0],
  ) {
    const driverFactory = this.list[name]
    if (!driverFactory) {
      throw new RuntimeException(
        `Unknown mail driver "${String(name)}". Make sure the driver is registered`,
      )
    }

    return driverFactory(config as any)
  }
}

const driversList = new MailDriversCollection()
export default driversList
