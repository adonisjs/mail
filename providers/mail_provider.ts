/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import type { Emitter } from '@adonisjs/core/events'
import type { ApplicationService } from '@adonisjs/core/types'

import { MailManager, Mailer } from '../index.js'
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

  register() {
    this.app.container.singleton('mail.manager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const mailConfigProvider = await this.app.config.get('mail')
      const config = await configProvider.resolve<any>(this.app, mailConfigProvider)
      return new MailManager(emitter as unknown as Emitter<MailEvents>, config)
    })

    this.app.container.bind(Mailer, async (resolver) => {
      const mailManager = await resolver.make('mail.manager')
      return mailManager.use()
    })
  }
}
