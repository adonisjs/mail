/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { createMailManager } from '../../../test_helpers/index.js'

test.group('Mail Manager | Preview', () => {
  test('Mail.preview should return the preview url', async ({ assert }) => {
    const { manager } = await createMailManager()

    const response = await manager.preview((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    const iframe = response.toIframe()

    assert.exists(response.url)
    assert.include(iframe, response.url)
  }).timeout(1000 * 10)

  test('multiple calls to preview should use one account', async ({ assert }) => {
    const { manager } = await createMailManager()

    const response = await manager.preview((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    const response1 = await manager.preview((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(response.account, response1.account)
    assert.notEqual(response.url, response1.url)
  }).timeout(1000 * 10)
})
