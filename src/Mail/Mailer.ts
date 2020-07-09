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
	DriverOptionsType,
	CompiledMailNode,
	MailerResponseType,
	MessageComposeCallback,
} from '@ioc:Adonis/Addons/Mail'

import { Message } from '../Message'
import { MailManager } from './MailManager'

/**
 * Mailer exposes the unified API to send emails using one of the pre-configure
 * driver
 */
export class Mailer<Name extends keyof MailersList> implements MailerContract<Name> {
	constructor(
		public name: Name,
		private manager: MailManager,
		private useQueue: boolean,
		public driver: MailersList[Name]['implementation']
	) {}

	/**
	 * Set the email contents by rendering the views. Views are only
	 * rendered when inline values are not defined.
	 */
	private setEmailContent({ message, views }: CompiledMailNode) {
		if (!message.html && views.html) {
			message.html = this.manager.view.render(views.html.template, views.html.data)
		}

		if (!message.text && views.text) {
			message.text = this.manager.view.render(views.text.template, views.text.data)
		}

		if (!message.watch && views.watch) {
			message.watch = this.manager.view.render(views.watch.template, views.watch.data)
		}
	}

	/**
	 * Sends email using a pre-compiled message. You should use [[MailerContract.send]], unless
	 * you are pre-compiling messages yourself
	 */
	public async sendCompiled(mail: CompiledMailNode) {
		/**
		 * Set content by rendering views
		 */
		this.setEmailContent(mail)

		/**
		 * Send email for real
		 */
		const response = await this.driver.send(mail.message, mail.config)

		/**
		 * Emit event
		 */
		this.manager.emitter.emit('adonis:mail:sent', {
			message: mail.message,
			views: Object.keys(mail.views).map((view) => mail.views[view].template),
			mailer: mail.mailer,
			response: response,
		})

		return (response as unknown) as Promise<MailerResponseType<Name>>
	}

	/**
	 * Sends email
	 */
	public async send(
		callback: MessageComposeCallback,
		config?: DriverOptionsType<MailersList[Name]>
	) {
		const message = new Message(false)
		await callback(message)

		const compiledMessage = message.toJSON()
		return this.sendCompiled({
			message: compiledMessage.message,
			views: compiledMessage.views,
			mailer: this.name,
			config: config,
		})
	}

	/**
	 * Send email later by queuing it inside an in-memory queue
	 */
	public async sendLater(
		callback: MessageComposeCallback,
		config?: DriverOptionsType<MailersList[Name]>
	) {
		if (!this.useQueue) {
			await this.send(callback, config)
			return
		}

		const message = new Message(false)
		await callback(message)

		const compiledMessage = message.toJSON()
		return this.manager.scheduleEmail({
			message: compiledMessage.message,
			views: compiledMessage.views,
			mailer: this.name,
			config: config,
		})
	}

	/**
	 * Invokes `close` method on the driver
	 */
	public async close() {
		await this.driver.close()
		this.manager.release(this.name)
	}
}
