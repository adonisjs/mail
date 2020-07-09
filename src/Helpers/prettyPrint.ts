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
	const views = [
		mail.message.views.html?.template,
		mail.message.views.text?.template,
		mail.message.views.watch?.template,
	]
		.filter((view) => !!view)
		.join(',')

	let output: string = color.gray(`"${mail.mailer}" `)

	/**
	 * Concatenate the mail subject
	 */
	output += `${mail.message.message.subject || 'No Subject'} `

	/**
	 * Colorize query and bindings
	 */
	output += color.cyan().underline(`To: ${mail.message.message.to}`)
	output += color.gray(` (${views})`)

	/**
	 * Print it to the console
	 */
	console.log(output)
}
