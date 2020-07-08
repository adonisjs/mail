/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MailEventData } from '@ioc:Adonis/Addons/Mail'

declare module '@ioc:Adonis/Core/Event' {
	export interface EventsList {
		'adonis:mail:send': MailEventData
	}
}
