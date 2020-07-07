/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import { ViewContract } from '@ioc:Adonis/Core/View'
import { MailerContract, MessageComposeCallback, MailersList, DriverReturnType } from '@ioc:Adonis/Addons/Mail'

import { Message } from '../Message'

/**
 * Mailer exposes the unified API to send emails using one of the pre-configure
 * driver
 */
export class Mailer<Name extends keyof MailersList> implements MailerContract<Name> {
	constructor(
		public name: Name,
		private view: ViewContract,
		public driver: MailersList[Name]['implementation'],
		public onClose: (mailer: Mailer<Name>) => void
	) {}

	/**
	 * Sends email
	 */
	public async send(callback: MessageComposeCallback, metaOptions?: MailersList[Name]['config']['meta']) {
		const message = new Message(this.view)
		await callback(message)
		return this.driver.send(message.toJSON(), metaOptions) as Promise<
			DriverReturnType<MailersList[Name]['implementation']>
		>
	}

	/**
	 * Invokes `close` method on the driver
	 */
	public async close() {
		await this.driver.close()
		this.onClose(this)
	}
}
