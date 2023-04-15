/*
 * @adonisjs/mail
 *
 * (c) Matt Strayer <git@mattstrayer.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import dotenv from 'dotenv'
import path, { join } from 'path'

import { existsSync, readFileSync, readdirSync, rmSync, unlinkSync } from 'fs'
import { FileDriver } from '../src/Drivers/File'
import { Message } from '../src/Message'
import { fs, setup } from '../test-helpers'

const TEMP_EMAIL_DIR = path.join('tmp', 'emails')

test.group('File Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(__dirname, '..', '.env') })
  })

  group.each.teardown(async () => {
    await fs.cleanup()
    rmSync(TEMP_EMAIL_DIR, { recursive: true, force: true })
  })

  test('filePath config option works', async ({ assert }) => {
    await setup()
    const fileDriver = new FileDriver({ filePath: 'src/Drivers' })
    const message = new Message()
    message.from(process.env.FROM_EMAIL!)
    message.to('virk@adonisjs.com')
    message.cc('info@adonisjs.com')
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const email = await fileDriver.send(message.toJSON().message)

    const emailFiles = readdirSync(path.join('src', 'Drivers'))

    for (const file of emailFiles) {
      if (path.extname(file) === '.eml') {
        const temp = readFileSync(path.join('src', 'Drivers', file), 'utf8')
        assert.isTrue(temp.includes('To: virk@adonisjs.com'))
        assert.isTrue(temp.includes('Cc: info@adonisjs.com'))
        assert.isTrue(temp.includes('Subject: Adonisv5'))
        assert.isTrue(temp.includes('<p> Hello Adonis </p>'))
        assert.isTrue(temp.includes(email.messageId))
      }
    }
  })
    .teardown(() => {
      const emailFiles = readdirSync(path.join('src', 'Drivers'))
      for (const file of emailFiles) {
        if (path.extname(file) === '.eml') {
          unlinkSync(path.join('src', 'Drivers', file))
        }
      }
    })
    .pin()

  test('send email using file driver', async ({ assert }) => {
    await setup()

    const fileDriver = new FileDriver()

    const message = new Message()
    message.from(process.env.FROM_EMAIL!)
    message.to('virk@adonisjs.com')
    message.cc('info@adonisjs.com')
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    // read the email
    const email = await fileDriver.send(message.toJSON().message)

    assert.isTrue(existsSync(TEMP_EMAIL_DIR))
    assert.isString(email.messageId)
    const emailFiles = readdirSync(TEMP_EMAIL_DIR)

    for (const file of emailFiles) {
      if (path.extname(file) === '.eml') {
        const temp = readFileSync(path.join('tmp', 'emails', file), 'utf8')
        assert.isTrue(temp.includes('To: virk@adonisjs.com'))
        assert.isTrue(temp.includes('Cc: info@adonisjs.com'))
        assert.isTrue(temp.includes('Subject: Adonisv5'))
        assert.isTrue(temp.includes('<p> Hello Adonis </p>'))
        assert.isTrue(temp.includes(email.messageId))
      }
    }
  })
    // TODO: Remove `pin`
    .pin()
})
