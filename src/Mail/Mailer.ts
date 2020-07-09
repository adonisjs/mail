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
	MessageNode,
	MailerContract,
	DriverOptionsType,
	MailerResponseType,
	MessageComposeCallback,
	MessageContentViewsNode,
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
		public driver: MailersList[Name]['implementation']
	) {}

	/**
	 * Set the email contents by rendering the views. Views are only
	 * rendered when inline values are not defined.
	 */
	private setEmailContent({
		message,
		views,
	}: {
		message: MessageNode
		views: MessageContentViewsNode
	}) {
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
	 * Sends compiled message as email. You must be using [[this.send]] most of the times. This
	 * method is mainly to send messages that were compiled ahead of time.
	 */
	public async sendCompiled(
		message: { message: MessageNode; views: MessageContentViewsNode },
		config?: DriverOptionsType<MailersList[Name]>
	) {
		/**
		 * Set content by rendering views
		 */
		this.setEmailContent(message)

		/**
		 * Send email for real
		 */
		const response = await this.driver.send(message.message, config)

		/**
		 * Emit event
		 */
		this.manager.emitter.emit('adonis:mail:sent', { message, mailer: this.name })

		return (response as unknown) as Promise<MailerResponseType<Name>>
	}

	/**
	 * Sends email
	 */
	public async send(
		callback: MessageComposeCallback,
		config?: DriverOptionsType<MailersList[Name]>
	) {
		const message = new Message()
		await callback(message)
		return this.sendCompiled(message.toJSON(), config)
	}

	/**
	 * Invokes `close` method on the driver
	 */
	public async close() {
		await this.driver.close()
		this.manager.release(this.name)
	}
}
