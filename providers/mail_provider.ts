/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import type { Emitter } from '@adonisjs/core/events'
import type { ApplicationService } from '@adonisjs/core/types'

import { MailManager, Mailer, Message } from '../index.js'
import type { MailEvents, MailService } from '../src/types.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'mail.manager': MailService
  }
  export interface EventsList extends MailEvents {}
}

/**
 * Mail provider to register mail manager with the container
 */
export default class MailProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Defines the template engine on the message class to
   * render templates
   */
  protected async defineTemplateEngine() {
    if (this.app.usingEdgeJS) {
      const edge = await import('edge.js')
      Message.templateEngine = edge.default
    }
  }

  /**
   * Registering bindings to container
   */
  register() {
    this.app.container.singleton('mail.manager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const mailConfigProvider = await this.app.config.get('mail')
      const config = await configProvider.resolve<any>(this.app, mailConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/mail.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new MailManager(emitter as unknown as Emitter<MailEvents>, config)
    })

    this.app.container.bind(Mailer, async (resolver) => {
      const mailManager = await resolver.make('mail.manager')
      return mailManager.use()
    })
  }

  /**
   * Invoked automatically when the app is booting
   */
  async boot() {
    await this.defineTemplateEngine()
  }

  /**
   * Cleanup hook
   */
  async shutdown() {
    const mail = await this.app.container.make('mail.manager')
    await mail.closeAll()
  }
}
