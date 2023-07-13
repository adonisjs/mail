/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Repl } from '@adonisjs/core/repl'
import { ApplicationService } from '@adonisjs/core/types'
import { fsImportAll } from '@poppinss/utils'

/**
 * Helper to define REPL state
 */
function setupReplState(repl: Repl, key: string, value: any) {
  repl.server!.context[key] = value
  repl.notify(
    `Loaded "${key}" service. You can access it using the "${repl.colors.underline(key)}" variable`
  )
}

/**
 * Define repl bindings. The method must be invoked when application environment
 * is set to repl.
 */
export function defineReplBindings(app: ApplicationService, repl: Repl) {
  repl.addMethod(
    'loadMail',
    async () => setupReplState(repl, 'mail', await app.container.make('mail')),
    { description: 'Load "mail" service in the REPL context' }
  )

  repl.addMethod(
    'loadMailers',
    async () => {
      const mailersPath = app.mailersPath()
      console.log(repl.colors.dim(`recursively reading mailers from "${mailersPath}"`))
      setupReplState(repl, 'mailers', await fsImportAll(mailersPath))
    },
    { description: 'Recursively loads Mailers to the "mailers" property' }
  )
}
