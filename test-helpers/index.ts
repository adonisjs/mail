/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/core/build/standalone'

export const fs = new Filesystem(join(__dirname, 'app'))

export async function setup(environment: 'web' | 'repl' = 'web', mailConfig?: any) {
  await fs.add('.env', '')
  await fs.add(
    'config/app.ts',
    `
		export const appKey = 'averylong32charsrandomsecretkey',
		export const http = {
			cookie: {},
			trustProxy: () => true,
		}
	`
  )

  await fs.add(
    'config/mail.ts',
    `
		const mailConfig = ${JSON.stringify(mailConfig || {}, null, 2)}
		export default mailConfig
	`
  )

  const app = new Application(fs.basePath, environment, {
    providers: [
      '@adonisjs/core',
      '@adonisjs/repl',
      '@adonisjs/view',
      '../../providers/MailProvider',
    ],
  })

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}
