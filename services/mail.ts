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

let mail: MailerService

/**
 * Returns a singleton instance of the Mail manager from the
 * container
 */
await app.booted(async () => {
  mail = await app.container.make('mail')
})

export { mail as default }
