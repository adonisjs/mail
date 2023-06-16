/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { SmtpConfig } from './drivers/smtp.js'
import type { MailgunConfig } from './drivers/mailgun.js'
import type { SesConfig } from './drivers/ses.js'
import type { SparkPostConfig } from './drivers/sparkpost.js'
import type { ManagerDriverFactory } from '../define_config.js'
import type { MailManager } from '../mail/mail_manager.js'
import type { MailgunDriver } from '../drivers/mailgun.js'
import type { SesDriver } from '../drivers/ses.js'
import type { SmtpDriver } from '../drivers/smtp.js'
import type { SparkPostDriver } from '../drivers/sparkpost.js'
import type { MessageNode, MessageContentViewsNode } from './message.js'
import type { MailDriversListContract, MailerResponseType, DriverOptionsType } from './helpers.js'
import type { Message } from '../message/index.js'
import type { BrevoConfig } from './drivers/brevo.js'
import type { BrevoDriver } from '../drivers/brevo.js'

/**
 * A list of known mailers inferred from the user config
 */
export interface MailersList {}
export type InferMailers<T extends { list: Record<string, ManagerDriverFactory> }> = T['list']

export interface MailerService
  extends MailManager<MailersList extends MailDriversListContract ? MailersList : never> {}

/**
 * A list of globally available mail drivers
 */
export interface MailDriversList {
  smtp: (config: SmtpConfig) => SmtpDriver
  mailgun: (config: MailgunConfig) => MailgunDriver
  sparkpost: (config: SparkPostConfig) => SparkPostDriver
  ses: (config: SesConfig) => SesDriver
  brevo: (config: BrevoConfig) => BrevoDriver
}

/*
|--------------------------------------------------------------------------
| Drivers Interface
|--------------------------------------------------------------------------
*/

/**
 * Shape of the driver contract. Each driver must adhere to
 * this interface
 */
export interface MailDriverContract {
  send(message: MessageNode, config?: any): Promise<any>
  close(): void | Promise<void>
}

/**
 * Shape of the callback passed to the `send` method to compose the
 * message
 */
export type MessageComposeCallback = (message: Message) => void | Promise<void>

/**
 * Callback to monitor queues response
 */
export type QueueMonitorCallback = (
  error?: Error & { mail: CompiledMailNode<any> },
  response?: {
    mail: CompiledMailNode<any>
    response: MailerResponseType<keyof MailersList, any>
  },
) => void

/**
 * Shape of the compiled mail.
 */
export type CompiledMailNode<KnownMailers extends MailDriversListContract> = {
  message: MessageNode
  views: MessageContentViewsNode
  mailer: keyof KnownMailers
  config?: any
}

/**
 * Packet emitted by the `mail:sent` event
 */
export type MailEventData<KnownMailers extends MailDriversListContract> = {
  message: MessageNode
  views: string[]
  mailer: keyof MailersList
  response: MailerResponseType<keyof MailersList, KnownMailers>
}

export interface MailerContract<
  KnownMailers extends MailDriversListContract,
  Name extends keyof KnownMailers,
> {
  /**
   * Mailer name
   */
  readonly name: Name

  /**
   * The driver in use
   */
  readonly driver: ReturnType<KnownMailers[Name]>

  /**
   * Send email
   */
  send(
    callback: MessageComposeCallback,
    config?: DriverOptionsType<ReturnType<KnownMailers[Name]>>,
  ): Promise<MailerResponseType<Name, KnownMailers>>

  /**
   * Sends email using a pre-compiled message. You should use [[MailerContract.send]]
   * or [[MailerContract.sendLater]], unless you are pre-compiling messages
   * yourself.
   */
  sendCompiled(
    mail: CompiledMailNode<KnownMailers>,
  ): Promise<MailerResponseType<Name, KnownMailers>>

  /**
   * Send email by pushing it to the in-memory queue
   */
  sendLater(
    callback: MessageComposeCallback,
    config?: DriverOptionsType<ReturnType<KnownMailers[Name]>>,
  ): Promise<void>

  /**
   * Close mailer
   */
  close(): Promise<void>
}

export * from './message.js'
export * from './helpers.js'
