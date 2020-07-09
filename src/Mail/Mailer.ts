/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import {
	MailersList,
	MailerContract,
	MailerResponseType,
	DriverOptionsType,
	MessageComposeCallback,
} from '@ioc:Adonis/Addons/Mail'
import { ProfilerContract, ProfilerRowContract } from '@ioc:Adonis/Core/Profiler'

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
	public async send(
		callback: MessageComposeCallback,
		config?: DriverOptionsType<MailersList[Name]>,
		profiler?: ProfilerContract | ProfilerRowContract
	) {
		const message = new Message(this.manager.view)
		await callback(message)

		/**
		 * Profile and send email
		 */
		const response = await (profiler || this.manager.profiler).profileAsync('mail:send', undefined, async () => {
			return this.driver.send(message.toJSON(), config)
		})

		this.manager.emitter.emit('adonis:mail:sent', { message, mailer: this.name })
		return (response as unknown) as Promise<MailerResponseType<Name>>
	}

	/**
	 * Invokes `close` method on the driver
	 */
	public async close() {
		await this.driver.close()
		this.manager.release(this.name)
	}
}
