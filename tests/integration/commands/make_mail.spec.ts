/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories'
import MakeMail from '../../../commands/make_mail.js'

test.group('MakeMail', () => {
  test('make mail class using the stub', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeMail, ['email_verification'])
    await command.exec()

    // command.assertLog('green(DONE:)    create app/mails/email_verification_provision.ts')
    command.assertLog('green(DONE:)    create app/mailers/email_verification_notification.ts')
    await assert.fileContains(
      'app/mailers/email_verification_notification.ts',
      `import { BaseMail } from '@adonisjs/mail'`
    )
    await assert.fileContains(
      'app/mailers/email_verification_notification.ts',
      `export default class EmailVerificationNotification extends BaseMail {`
    )
  })
})
