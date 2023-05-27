/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { test } from '@japa/runner'
import { AppFactory } from '@adonisjs/application/factories'

import { stubsRoot } from '../../stubs/index.js'

const BASE_URL = new URL('./tmp/', import.meta.url)
const BASE_PATH = fileURLToPath(BASE_URL)

test.group('Make mailer command', () => {
  test('create mailer stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL, () => {})
    await app.init()

    const stub = await app.stubs.build('make/mailer.stub', { source: stubsRoot })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('order'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/mailers/order_notification.ts'))
    assert.match(contents, /export default class OrderNotification/)
  })
})
