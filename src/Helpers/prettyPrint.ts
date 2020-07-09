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
 * Formats recipients for display
 */
function formatRecipients(recipients: string[]) {
	return recipients.length <= 3 ? recipients.join(',') : `${recipients.length} recipients`
}

/**
 * Returns display message for the accepted recipients (if any)
 */
function getAcceptedRecipients(response: MailEventData['response']): string | undefined {
	if ('accepted' in response) {
		return formatRecipients(response.accepted)
	}
}

/**
 * Returns display message for the accepted recipients (if any)
 */
function getRejectedRecipients(response: MailEventData['response']): string | undefined {
	if ('rejected' in response) {
		return formatRecipients(response.rejected)
	}
}

/**
 * Returns display message for the accepted recipients (if any)
 */
function getMessageRecipients(message: MailEventData['message']): string {
	return formatRecipients((message.to || []).map(({ address }) => address))
}

/**
 * Pretty prints the email event
 */
export function prettyPrint(mail: MailEventData) {
	/**
	 * Lazy loading pretty printed dependencies
	 */
	const color = require('kleur')

	/**
	 * Begin
	 */
	let output: string = color.dim(`┌ "${mail.mailer}" `)

	/**
	 * Concatenate the mail subject
	 */
	output += color.underline(`Subject: ${mail.message.subject || 'No Subject'} `)

	/**
	 * Show views (if used)
	 */
	if (mail.views.length) {
		output += color.dim(` (${mail.views.join(',')})`)
	}

	/**
	 * Show from address
	 */
	output += `\n${color.dim('│')}  ${color.dim('from:')} ${mail.message.from?.address}`

	/**
	 * Show accepted or to recipients
	 */
	const acceptedRecipients = getAcceptedRecipients(mail.response)
	if (acceptedRecipients) {
		output += `\n${color.dim('│')}  ${color.dim('accepted:')} ${acceptedRecipients}`
	} else {
		output += `\n${color.dim('│')}  ${color.dim('to:')} ${getMessageRecipients(mail.message)}`
	}

	/**
	 * Show rejected recipients
	 */
	const rejectedRecipients = getRejectedRecipients(mail.response)
	if (rejectedRecipients) {
		output += `\n${color.dim('│')}  ${color.red().dim('rejected:')} ${rejectedRecipients}`
	}

	/**
	 * Show total attachments
	 */
	const attachments = (mail.message.attachments || []).length
	output += `\n${color.dim('│')}  ${color.dim('attachments:')} ${attachments} attachment(s)`

	/**
	 * End
	 */
	output += `\n${color.dim('└')}  sent`

	/**
	 * Print it to the console
	 */
	console.log(output)
}
