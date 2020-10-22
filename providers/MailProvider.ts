/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Mail provider to register mail specific bindings
 */
export default class MailProvider {
	constructor(protected app: ApplicationContract) {}
	public static needsApplication = true

	/**
	 * Register bindings with the container
	 */
	public register() {
		this.app.container.singleton('Adonis/Addons/Mail', () => {
			const config = this.app.container.use('Adonis/Core/Config').get('mail', {})
			const { MailManager } = require('../src/Mail/MailManager')
			return new MailManager(this.app, config)
		})
	}

	/**
	 * Setup REPL bindings
	 */
	public boot() {
		if (this.app.environment !== 'repl') {
			return
		}

		this.app.container.with(['Adonis/Addons/Repl'], (Repl) => {
			const { defineReplBindings } = require('../src/Bindings/Repl')
			defineReplBindings(this.app, Repl)
		})
	}

	/**
	 * Close all drivers when shutting down the app
	 */
	public async shutdown() {
		await this.app.container.use('Adonis/Addons/Mail').closeAll()
	}
}
