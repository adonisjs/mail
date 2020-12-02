/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { requireAll } from '@poppinss/utils'
import { ReplContract } from '@ioc:Adonis/Addons/Repl'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Helper to define REPL state
 */
function setupReplState(repl: ReplContract, key: string, value: any) {
	repl.server.context[key] = value
	repl.notify(
		`Loaded ${key} module. You can access it using the "${repl.colors.underline(key)}" variable`
	)
}

/**
 * Defune repl bindings. The method must be invoked when application environment
 * is set to repl.
 */
export function defineReplBindings(application: ApplicationContract, Repl: ReplContract) {
	Repl.addMethod(
		'loadMail',
		(repl) => {
			setupReplState(repl, 'Mail', application.container.use('Adonis/Addons/Mail'))
		},
		{
			description: 'Load mail provider and save reference to the "Mail" variable',
		}
	)

	Repl.addMethod(
		'loadMailers',
		(repl) => {
			const mailersPath = application.resolveNamespaceDirectory('mailers') || 'app/Mailers'
			console.log(repl.colors.dim(`recursively reading mailers from "${mailersPath}"`))

			const mailerAbsPath = application.makePath(mailersPath)
			setupReplState(repl, 'mailers', requireAll(mailerAbsPath))
		},
		{
			description: 'Recursively loads Mailers to the "mailers" property',
		}
	)
}
