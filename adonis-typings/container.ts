/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Application' {
	import { MailManagerContract } from '@ioc:Adonis/Addons/Mail'

	export interface ContainerBindings {
		'Adonis/Addons/Mail': MailManagerContract
	}
}
