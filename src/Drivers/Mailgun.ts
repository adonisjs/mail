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

import { MessageNode, MailgunResponse, MailgunConfig, MailDriverContract } from '@ioc:Adonis/Addons/Mail'

/**
 * Ses driver to send email using ses
 */
export class MailgunDriver implements MailDriverContract {
	private transporter: any

	constructor(config: MailgunConfig) {
		this.transporter = nodemailer.createTransport(new MailgunTransport(config))
	}

	/**
	 * Send message
	 */
	public async send(message: MessageNode): Promise<MailgunResponse> {
		if (!this.transporter) {
			throw new Error('Driver transport has been closed and cannot be used for sending emails')
		}

		return this.transporter.sendMail(message)
	}

	/**
	 * Close transporter connection, helpful when using connections pool
	 */
	public async close() {
		this.transporter.close()
		this.transporter = null
	}
}
