/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import { MailService } from '../src/types.js'

let mail: MailService

/**
 * Returns a singleton instance of the MailManager class from the
 * container.
 */
await app.booted(async () => {
  mail = await app.container.make('mail.manager')
})

export { mail as default }
