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
import MakeMailer from '../../commands/make_mailer.js'

test.group('Make mailer command', (group) => {
  group.each.teardown(async () => {
    delete process.env.ADONIS_ACE_CWD
  })

  test('create mailer stub', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeMailer, ['order'])
    await command.exec()

    command.assertLog('green(DONE:)    create app/mailers/order_notification.ts')
    const file = await fs.contents('app/mailers/order_notification.ts')
    assert.snapshot(file).match()
  })
})
