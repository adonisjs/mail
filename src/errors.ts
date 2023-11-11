/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'

/**
 * The error is raised when the transport is unable to
 * send the email
 */
export const E_MAIL_TRANSPORT_ERROR = class EmailTransportException extends Exception {
  static status = 400
  static code = 'E_MAIL_TRANSPORT_ERROR'
}
