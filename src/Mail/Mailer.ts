/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import { MailerContract, MessageComposeCallback, MailersList, DriverReturnType } from '@ioc:Adonis/Addons/Mail'

import { Message } from '../Message'
import { MailManager } from './MailManager'

/**
 * Mailer exposes the unified API to send emails using one of the pre-configure
 * driver
 */
export class Mailer<Name extends keyof MailersList> implements MailerContract<Name> {
	constructor(public name: Name, private manager: MailManager, public driver: MailersList[Name]['implementation']) {}

	/**
	 * Sends email
	 */
	public async send(callback: MessageComposeCallback, metaOptions?: MailersList[Name]['config']['meta']) {
		const message = new Message(this.manager.view)
		await callback(message)

		await this.manager.hooks.exec('before', 'send', this, message)
		const response = await this.driver.send(message.toJSON(), metaOptions)

		await this.manager.hooks.exec('after', 'send', this, response)
		return (response as unknown) as Promise<DriverReturnType<MailersList[Name]['implementation']>>
	}

	/**
	 * Invokes `close` method on the driver
	 */
	public async close() {
		await this.driver.close()
		this.manager.release(this.name)
	}
}
