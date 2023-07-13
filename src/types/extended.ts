/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {
  MailDriversListContract,
  MailSendingEventData,
  MailSentEventData,
  MailerService,
  MailersList,
} from './main.js'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    mail: MailerService
  }

  export interface EventsList {
    /**
     * Just before the mailer sends the email
     */
    'mail:sending': MailSendingEventData<
      MailersList extends MailDriversListContract ? MailersList : never
    >

    /**
     * After the mailer has sent the email
     */
    'mail:sent': MailSentEventData<
      MailersList extends MailDriversListContract ? MailersList : never
    >
  }
}
