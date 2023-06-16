/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RequestError } from 'got'
import { Exception } from '@poppinss/utils'

/**
 * Exception raised when API calls to the transport service fails
 */
export class EmailTransportException extends Exception {
  response: any = {}

  static apiFailure(error: RequestError) {
    if (error.response) {
      const exception = new this(
        error.response.statusMessage || 'Unable to send email. Check "error.response" for details',
        { status: error.response.statusCode },
      )
      exception.response = error.response.body
      return error
    }

    return new this(error.message, { status: 500 })
  }
}
