/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IocContract } from '@adonisjs/fold'

/**
 * Mail provider to register mail specific bindings
 */
export default class MailProvider {
	constructor(protected container: IocContract) {}

	public register() {
		this.container.singleton('Adonis/Addons/Mail', () => {
			const config = this.container.use('Adonis/Core/Config').get('mail', {})

			const { MailManager } = require('../src/Mail/MailManager')
			return new MailManager(this.container, config)
		})
	}

	public boot() {
		if (!this.container.hasBinding('Adonis/Core/View')) {
			throw new Error('"@adonisjs/mail" requires "@adonisjs/view" to render mail templates')
		}

		if (!this.container.hasBinding('Adonis/Core/Logger')) {
			throw new Error('"@adonisjs/mail" requires "@adonisjs/core" to send emails')
		}
	}

	public async shutdown() {
		await this.container.use('Adonis/Addons/Mail').closeAll()
	}
}
