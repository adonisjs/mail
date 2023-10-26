/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import { ApplicationService } from '@adonisjs/core/types'

import { defineReplBindings } from '../src/bindings.js'
import edge from 'edge.js'

/**
 * Mail provider to register mail specific bindings
 */
export default class MailProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register mail manager singleton
   */
  #registerMailManager() {
    this.app.container.singleton('mail', async () => {
      const { MailManager } = await import('../src/managers/mail_manager.js')

      const logger = await this.app.container.make('logger')
      const emitter = await this.app.container.make('emitter')

      const mailConfigProvider = this.app.config.get('mail', {})

      const config = await configProvider.resolve<any>(this.app, mailConfigProvider)

      if (!config) {
        throw new Error(
          'Invalid config exported from "config/mail.ts" file. Make sure to use the defineConfig method'
        )
      }

      return new MailManager(edge, emitter, logger, config)
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
   * Close all drivers when shutting down the app
   */
  async shutdown() {
    const mail = await this.app.container.make('mail')
    await mail.closeAll()
  }
}
