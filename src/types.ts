/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TlsOptions } from 'node:tls'
import { SendMailOptions } from 'nodemailer'
import type { ConfigProvider } from '@adonisjs/core/types'
import type MimeNode from 'nodemailer/lib/mime-node/index.js'

import type { Message } from './message.js'
import { MailResponse } from './mail_response.js'

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

/**
 * The properties that can be used to search for mail messages
 * inside fakes
 */
export type MessageSearchOptions = Omit<NodeMailerMessage, 'attachments' | 'icalEvent'>

/*
|--------------------------------------------------------------------------
| Drivers Interface
|--------------------------------------------------------------------------
*/

/**
 * Shape of the mail driver. Each driver must adhere to
 * this interface
 */
export interface MailDriverContract {
  /**
   * Send email
   */
  send(message: NodeMailerMessage, config?: unknown): Promise<MailResponse<unknown>>

  /**
   * Cleanup driver long-lived connections
   */
  close(): void | Promise<void>
}

/**
 * Factory function to lazily initiate a driver
 */
export type MailManagerDriverFactory = () => MailDriverContract

/**
 * Shape of the callback passed to the `send` method to compose the
 * message
 */
export type MessageComposeCallback = (message: Message) => void | Promise<void>

/**
 * Events emitted by the mailer
 */
export type MailEvents = {
  'mail:sending': {
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }
  'mail:sent': {
    message: NodeMailerMessage
    views: MessageBodyTemplates
    response: MailResponse<unknown>
  }
  'mail:queueing': {
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }
  'mail:queued': {
    message: NodeMailerMessage
    views: MessageBodyTemplates
  }
}

/*
|--------------------------------------------------------------------------
| Mailgun driver types
|--------------------------------------------------------------------------
*/

/**
 * Config accepted by the Mailgun driver at the
 * time of sending the email
 */
export type MailgunRuntimeConfig = {
  oTags?: string[]
  oDeliverytime?: Date
  oTestMode?: boolean
  oTracking?: boolean
  oTrackingClick?: boolean
  oTrackingOpens?: boolean
  headers?: { [key: string]: string }
}

/**
 * Config accepted by the Mailgun driver at the
 * time of constructing the driver
 */
export type MailgunConfig = MailgunRuntimeConfig & {
  baseUrl: string
  key: string
  domain: string
  oDkim?: boolean
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
| SMTP driver types
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
 * SMTP driver config
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
  rateDelta?: number
  rateLimit?: number

  /**
   * Proxy
   */
  proxy?: string
}

/*
|--------------------------------------------------------------------------
| SES driver types
|--------------------------------------------------------------------------
*/

/**
 * SES driver config
 */
export type SESConfig = {
  apiVersion: string
  key: string
  secret: string
  region: string
  sslEnabled?: boolean
  sendingRate?: number
  maxConnections?: number
}

/*
|--------------------------------------------------------------------------
| SparkPost driver types
|--------------------------------------------------------------------------
*/

/**
 * Following options can be defined during the `Mail.send` call
 */
export type SparkPostRuntimeConfig = {
  startTime?: Date
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
| Resend driver types
|--------------------------------------------------------------------------
*/

export type ResendRuntimeConfig = {
  tags?: {
    name: string
    value?: string
  }[]
}

/**
 * Resend driver config
 */
export type ResendConfig = ResendRuntimeConfig & {
  key: string
  baseUrl: string
}

/*
|--------------------------------------------------------------------------
| Mailer types
|--------------------------------------------------------------------------
*/
export type MailerConfig = {
  /**
   * Define a global email address to always use when
   * sending emails
   */
  from?: string
}

/**
 * Template engine accepted by the mailer to render
 * templates to compute mail body contents
 */
export interface MailerTemplateEngine {
  /**
   * Render a template to contents
   */
  render(templatePath: string, data?: any): Promise<string> | string
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
  T extends ConfigProvider<{ mailers: Record<string, MailManagerDriverFactory> }>,
> = Awaited<ReturnType<T['resolver']>>['mailers']
