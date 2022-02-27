/*
 * @adonisjs/assembler
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { join } from 'path'
import importFresh from 'import-fresh'
import { Kernel } from '@adonisjs/ace'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/application'

import MakeMailer from '../commands/MakeMailer'

const fs = new Filesystem(join(__dirname, '__app'))
const templates = new Filesystem(join(__dirname, '..', 'templates'))

test.group('Make Mailer', (group) => {
  group.setup(() => {
    process.env.ADONIS_ACE_CWD = fs.basePath
  })

  group.teardown(() => {
    delete process.env.ADONIS_ACE_CWD
  })

  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('make a mailer inside the default directory', async ({ assert }) => {
    await fs.add('.adonisrc.json', JSON.stringify({}))

    const rcContents = importFresh(join(fs.basePath, '.adonisrc.json')) as any
    const app = new Application(fs.basePath, 'test', rcContents)

    const mailer = new MakeMailer(app, new Kernel(app))
    mailer.name = 'newUser'
    await mailer.run()

    const NewUserMailer = await fs.get('app/Mailers/NewUser.ts')
    const MailerTemplate = await templates.get('mailer.txt')

    assert.deepEqual(
      NewUserMailer.split('\n'),
      MailerTemplate.replace(/{{filename}}/g, 'NewUser').split('\n')
    )
  })

  test('make a mailer inside a custom directory', async ({ assert }) => {
    await fs.add(
      '.adonisrc.json',
      JSON.stringify({
        aliases: {
          App: './app',
        },
        namespaces: {
          mailers: 'App/My/Mailers',
        },
      })
    )

    const rcContents = importFresh(join(fs.basePath, '.adonisrc.json')) as any
    const app = new Application(fs.basePath, 'test', rcContents)

    const mailer = new MakeMailer(app, new Kernel(app))
    mailer.name = 'newUser'
    await mailer.run()

    const NewUserMailer = await fs.get('app/My/Mailers/NewUser.ts')
    const MailerTemplate = await templates.get('mailer.txt')

    assert.deepEqual(
      NewUserMailer.split('\n'),
      MailerTemplate.replace(/{{filename}}/g, 'NewUser').split('\n')
    )
  })
})
