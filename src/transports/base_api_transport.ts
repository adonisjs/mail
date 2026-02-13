/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { validateConfig } from '../utils.js'
import type { MailResponse } from '../mail_response.js'
import type { NodeMailerMessage, MailTransportContract } from '../types.js'

/**
 * Base class for HTTP based transports to validate the config
 * and normalize the base URL
 */
export abstract class BaseApiTransport<Config extends { key: string; baseUrl: string }>
  implements MailTransportContract
{
  constructor(
    protected name: string,
    protected config: Config
  ) {
    validateConfig(name, config)
  }

  abstract send(message: NodeMailerMessage, config?: any): Promise<MailResponse<any>>
}
