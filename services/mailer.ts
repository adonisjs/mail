/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import { MailerService } from '../src/types/main.js'

let mailer: MailerService

/**
 * Returns a singleton instance of the Mail manager from the
 * container
 */
await app.booted(async () => {
  mailer = await app.container.make('mail')
})

export { mailer as default }
