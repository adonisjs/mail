/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TlsOptions } from 'node:tls'
import type { SendMailOptions } from 'nodemailer'
import type { SESClientConfig } from '@aws-sdk/client-ses'
import type { ConfigProvider } from '@adonisjs/core/types'
import type MimeNode from 'nodemailer/lib/mime-node/index.js'

import type { Message } from './message.js'
import type { BaseMail } from './base_mail.js'
import type { MailManager } from './mail_manager.js'
import type { MailResponse } from './mail_response.js'

/**
 * Shape of the envelope node after the email has been
 * sent
 */
export type ResponseEnvelope = MimeNode.Envelope

/**
 * Shape of the recipient
 */
export type Recipient = { address: string; name: string } | string

/**
 * Available calendar event methods
 */
export type CalendarEventMethod =
  | 'PUBLISH'
  | 'REQUEST'
  | 'REPLY'
  | 'ADD'
  | 'CANCEL'
  | 'REFRESH'
  | 'COUNTER'
  | 'DECLINECOUNTER'

/**
 * Event options accepted by the icalEvent* methods
 */
export type CalendarEventOptions = {
  method?: CalendarEventMethod
  filename?: string
  encoding?: string
}

/**
 * Shape of data view defined on the message
 */
export type MessageBodyTemplates = {
  html?: { template: string; data?: any }
  text?: { template: string; data?: any }
  watch?: { template: string; data?: any }
}

/**
 * Attachment options accepted by the attachment
 * methods.
 */
export type AttachmentOptions = Exclude<SendMailOptions['attachments'], undefined>[number]

/**
 * Message node is compatible with nodemailer `sendMail` method
 */
export type NodeMailerMessage = {
  from?: Recipient
  to?: Recipient[]
  cc?: Recipient[]
  bcc?: Recipient[]
  replyTo?: Recipient[]
  messageId?: SendMailOptions['messageId']
  subject?: SendMailOptions['subject']
  inReplyTo?: SendMailOptions['inReplyTo']
  references?: SendMailOptions['references']
  encoding?: SendMailOptions['encoding']
  priority?: SendMailOptions['priority']
  envelope?: SendMailOptions['envelope']
  list?: SendMailOptions['list']
  icalEvent?: CalendarEventOptions & {
    content?: string
    path?: string
    href?: string
  }
  attachments?: SendMailOptions['attachments']
  headers?: SendMailOptions['headers']
  html?: SendMailOptions['html']
  text?: SendMailOptions['text']
  watch?: SendMailOptions['watchHtml']
}

/*
|--------------------------------------------------------------------------
| Transports Interface
|--------------------------------------------------------------------------
*/

/**
 * Shape of the mail transport. Each transport must adhere to
 * this interface
 */
export interface MailTransportContract {
  /**
   * Send email
   */
  send(message: NodeMailerMessage, config?: unknown): Promise<MailResponse<unknown>>

  /**
   * Cleanup transport long-lived connections
   */
  close?(): void | Promise<void>
}

/**
 * Factory function to lazily initiate a transport
 */
export type MailManagerTransportFactory = () => MailTransportContract

/**
 * Shape of the callback passed to the `send` method to compose the
 * message
 */
export type MessageComposeCallback = (message: Message) => void | Promise<void>

/*
|--------------------------------------------------------------------------
| Mailer types
|--------------------------------------------------------------------------
*/

/**
 * Events emitted by the mailer
 */
export type MailEvents = {
  'mail:sending': {
    mailerName: string
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }
  'mail:sent': {
    mailerName: string
    message: NodeMailerMessage
    views: MessageBodyTemplates
    response: MailResponse<unknown>
  }
  'mail:queueing': {
    mailerName: string
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }
  'mail:queued': {
    metaData?: any
    mailerName: string
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }
  'queued:mail:error': {
    error: any
    metaData?: any
    mailerName: string
  }
}

/**
 * Mailer contract represents a mailer that can be
 * used to send emails
 */
export interface MailerContract<Transport extends MailTransportContract> {
  name: string

  /**
   * Configure the messenger to use for sending email asynchronously
   */
  setMessenger(messenger: MailerMessenger): this

  /**
   * Sends a compiled email using the underlying transport
   */
  sendCompiled(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ): Promise<Awaited<ReturnType<Transport['send']>>>

  /**
   * Sends email
   */
  send(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: Parameters<Transport['send']>[1]
  ): Promise<Awaited<ReturnType<Transport['send']>>>

  /**
   * Send an email asynchronously using the mail messenger. The
   * default messenger uses an in-memory queue, unless you have
   * configured a custom messenger.
   */
  sendLater(
    callbackOrMail: MessageComposeCallback | BaseMail,
    config?: Parameters<Transport['send']>[1]
  ): Promise<void>

  /**
   * Invokes `close` method on the transport
   */
  close(): Promise<void>
}

export type MailerConfig = {
  /**
   * Define a global email address to always use when
   * sending emails
   */
  from?: Recipient

  /**
   * Define a global replyTo email address to always use
   * when sending emails
   */
  replyTo?: Recipient
}

/**
 * Template engine accepted by the mailer to render
 * templates to compute mail body contents
 */
export interface MailerTemplateEngine {
  /**
   * Render a template to contents
   */
  render(templatePath: string, helpers?: any, data?: any): Promise<string> | string
}

/**
 * Messenger accepted by the mailer to send emails asynchronously
 */
export interface MailerMessenger {
  queue(
    mail: { message: NodeMailerMessage; views: MessageBodyTemplates },
    sendConfig?: unknown
  ): Promise<any>
}

/*
|--------------------------------------------------------------------------
| Fake Mailer types
|--------------------------------------------------------------------------
*/
export type MessageSearchOptions = {
  subject?: string
  to?: string
  from?: string
  attachments?: string[]
}

/*
|--------------------------------------------------------------------------
| Mailgun transport types
|--------------------------------------------------------------------------
*/

/**
 * Config accepted by the Mailgun transport at the
 * time of sending the email
 */
export type MailgunRuntimeConfig = {
  oDkim?: boolean
  oTags?: string[]
  oDeliverytime?: Date
  oTestMode?: boolean
  oTracking?: boolean
  oTrackingClick?: boolean
  oTrackingOpens?: boolean
  headers?: { [key: string]: string }
  variables?: { [key: string]: string }
}

/**
 * Config accepted by the Mailgun transport at the
 * time of constructing the transport
 */
export type MailgunConfig = MailgunRuntimeConfig & {
  baseUrl: string
  key: string
  domain: string
}

/**
 * Response returned by the Mailgun transport
 */
export type MailgunSentMessageInfo = {
  id: string
  messageId: string
  envelope: ResponseEnvelope
}

/*
|--------------------------------------------------------------------------
| SMTP transport types
|--------------------------------------------------------------------------
*/

/**
 * Login options for Oauth2 SMTP login
 */
export type SMTPOauth2 = {
  type: 'OAuth2'
  user: string
  clientId: string
  clientSecret: string
  refreshToken?: string
  accessToken?: string
  expires?: string | number
  accessUrl?: string
}

/**
 * Login options for simple SMTP login
 */
export type SMTPSimpleAuth = {
  type: 'login'
  user: string
  pass: string
}

/**
 * SMTP transport config
 */
export type SMTPConfig = {
  host: string
  port?: number | string
  secure?: boolean

  /**
   * Authentication
   */
  auth?: SMTPSimpleAuth | SMTPOauth2

  /**
   * TLS options
   */
  tls?: TlsOptions
  ignoreTLS?: boolean
  requireTLS?: boolean

  /**
   * Pool options
   */
  pool?: boolean
  maxConnections?: number
  maxMessages?: number

  /**
   * Proxy
   */
  proxy?: string
}

/*
|--------------------------------------------------------------------------
| SES transport types
|--------------------------------------------------------------------------
*/

/**
 * SES transport config
 */
export type SESConfig = SESClientConfig & {
  sendingRate?: number
  maxConnections?: number
}

/*
|--------------------------------------------------------------------------
| SparkPost transport types
|--------------------------------------------------------------------------
*/

/**
 * Following options can be defined during the `Mail.send` call
 */
export type SparkPostRuntimeConfig = {
  startTime?: Date
  initialOpen?: boolean
  openTracking?: boolean
  clickTracking?: boolean
  transactional?: boolean
  sandbox?: boolean
  skipSuppression?: boolean
  ipPool?: string
}

/**
 * Spark post config
 */
export type SparkPostConfig = SparkPostRuntimeConfig & {
  baseUrl: string
  key: string
}

/**
 * Response returned by the SparkPost transport
 */
export type SparkPostSentMessageInfo = {
  id: string
  messageId: string
  envelope: ResponseEnvelope
  total_rejected_recipients: number
  total_accepted_recipients: number
}

/*
|--------------------------------------------------------------------------
| Resend transport types
|--------------------------------------------------------------------------
*/

export type ResendRuntimeConfig = {
  tags?: {
    name: string
    value?: string
  }[]
}

/**
 * Resend transport config
 */
export type ResendConfig = ResendRuntimeConfig & {
  key: string
  baseUrl: string
}

/**
 * Response returned by the Resend API
 */
export type ResendSentMessageInfo = {
  id: string
  messageId: string
  envelope: ResponseEnvelope
}

/*
|--------------------------------------------------------------------------
| Brevo transport types
|--------------------------------------------------------------------------
*/

export type BrevoRuntimeConfig = {
  scheduledAt?: Date
  tags?: string[]
}

/**
 * Brevo transport config
 */
export type BrevoConfig = BrevoRuntimeConfig & {
  key: string
  baseUrl: string
}

/**
 * Response returned by the Brevo API
 */
export type BrevoSentMessageInfo = {
  messageId: string
  envelope: ResponseEnvelope
}

/*
|--------------------------------------------------------------------------
| Mailer service types
|--------------------------------------------------------------------------
*/

/**
 * A list of known mailers inferred from the user config
 */
export interface MailersList {}

/**
 * Helper method to resolve configured mailers
 * inside user app
 */
export type InferMailers<
  T extends ConfigProvider<{ mailers: Record<string, MailManagerTransportFactory> }>,
> = Awaited<ReturnType<T['resolver']>>['mailers']

/**
 * Mailer service is a singleton instance of mail
 * manager configured using user app's config
 */
export interface MailService
  extends MailManager<
    MailersList extends Record<string, MailManagerTransportFactory> ? MailersList : never
  > {}

export type Constructor = abstract new (...args: any[]) => any
export type NormalizeConstructor<T extends Constructor> = {
  new (...args: any[]): InstanceType<T>
} & Omit<T, 'constructor'>
