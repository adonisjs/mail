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
	DriverReturnType,
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
	 * Exposing profile, so that a custom one can be defined (if needed)
	 */
	public profiler: ProfilerContract | ProfilerRowContract = this.manager.profiler

	/**
	 * Sends email
	 */
	public async send(callback: MessageComposeCallback, config?: DriverOptionsType<MailersList[Name]>) {
		const message = new Message(this.manager.view)
		await callback(message)

		const mail = this.manager.profiler.create('mail:send', { mailer: this.name, subject: message.subject })

		try {
			/**
			 * Execute before hooks
			 */
			await mail.profileAsync('mail:before:hooks', undefined, async () => {
				await this.manager.hooks.exec('before', 'send', this, message)
			})

			/**
			 * Send email
			 */
			const response = await mail.profileAsync('mail:send', undefined, async () => {
				return this.driver.send(message.toJSON(), config)
			})

			/**
			 * Execute after hooks
			 */
			await mail.profileAsync('mail:after:hooks', undefined, async () => {
				await this.manager.hooks.exec('after', 'send', this, response)
			})

			mail.end()
			this.manager.emitter.emit('adonis:mail:sent', { message, mailer: this.name })
			return (response as unknown) as Promise<DriverReturnType<MailersList[Name]['implementation']>>
		} catch (error) {
			mail.end({ error })
			throw error
		}
	}

	/**
	 * Invokes `close` method on the driver
	 */
	public async close() {
		await this.driver.close()
		this.manager.release(this.name)
	}
}
