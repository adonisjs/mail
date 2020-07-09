/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MailEventData } from '@ioc:Adonis/Addons/Mail'

/**
 * Pretty prints the email event
 */
export function prettyPrint(mail: MailEventData) {
	/**
	 * Lazy loading pretty printed dependencies
	 */
	const color = require('kleur')

	let output: string = color.gray(`"${mail.mailer}" `)

	/**
	 * Concatenate the mail subject
	 */
	output += `${mail.message.subject || 'No Subject'} `

	/**
	 * Colorize query and bindings
	 */
	output += color.cyan().underline(`To: ${mail.message.to}`)

	if (mail.views.length) {
		output += color.gray(` (${mail.views.join(',')})`)
	}

	/**
	 * Print it to the console
	 */
	console.log(output)
}
