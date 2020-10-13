/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ReplContract } from '@ioc:Adonis/Addons/Repl'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Defune repl bindings. The method must be invoked when application environment
 * is set to repl.
 */
export function defineReplBindings(application: ApplicationContract, Repl: ReplContract) {
	Repl.addMethod(
		'loadMailer',
		(repl) => {
			repl.server.context.Mail = application.container.use('Adonis/Addons/Mail')
			repl.notify(
				`Loaded Mail module. You can access it using the "${repl.colors.underline(
					'Mail'
				)}" variable`
			)
		},
		{
			description: 'Load mail provider and save reference to the "Mail" variable',
		}
	)
}
