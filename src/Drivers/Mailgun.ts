/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import nodemailer from 'nodemailer'
import { MailgunTransport } from '../Transports/Mailgun'

import {
	MessageNode,
	MailgunResponse,
	MailgunConfig,
	MailDriverContract,
	MailgunRuntimeConfig,
} from '@ioc:Adonis/Addons/Mail'

/**
 * Ses driver to send email using ses
 */
export class MailgunDriver implements MailDriverContract {
	constructor(private config: MailgunConfig) {}

	/**
	 * Send message
	 */
	public async send(message: MessageNode, config?: MailgunRuntimeConfig): Promise<MailgunResponse> {
		const transporter = nodemailer.createTransport(
			new MailgunTransport({
				...this.config,
				...config,
			})
		)

		return transporter.sendMail(message)
	}

	public async close() {}
}
