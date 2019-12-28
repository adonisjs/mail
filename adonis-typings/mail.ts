/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

declare module '@ioc:Adonis/Addons/Mail' {
  import { TlsOptions } from 'tls'
  import { Readable } from 'stream'
  import { ManagerContract } from '@poppinss/manager'

  /**
   * Shape of the driver contract. Each driver must adhere to
   * this interface
   */
  export interface MailDriverContract {
    send (message: MessageNode, config?: any): Promise<any>
    close (): void | Promise<void>
  }

  /**
   * Attachment options
   */
  export type AttachmentOptionsNode = {
    filename?: string,
    href?: string,
    httpHeaders?: { [key: string]: any },
    contentType?: string,
    contentDisposition?: string,
    encoding?: string,
    headers?: { [key: string]: any },
  }

  /**
   * Shape of envolpe
   */
  export type EnvolpeNode = { from?: string, to?: string, cc?: string, bcc?: string }

  /**
   * Message node is compatible with nodemailer `sendMail` method
   */
  export type MessageNode = {
    from?: { address: string, name?: string },
    to?: { address: string, name?: string }[],
    cc?: { address: string, name?: string }[],
    bcc?: { address: string, name?: string }[],
    messageId?: string,
    subject?: string,
    replyTo?: { address: string, name?: string },
    inReplyTo?: string,
    references?: string[],
    encoding?: string,
    priority?: 'low' | 'normal' | 'high',
    envelope?: EnvolpeNode,
    attachments?: (AttachmentOptionsNode & { path?: string, cid?: string, content?: Buffer | Readable })[],
    headers?: ({
      [key: string]: string | string[],
    } | {
      [key: string]: { prepared: true, value: string | string[] },
    })[],
    html?: string,
    watch?: string,
    text?: string,
  }

  /**
   * Shape of the message instance passed to `send` method callback
   */
  export interface MessageContract {
    /**
     * Common fields
     */
    to (address: string, name?: string): this
    from (address: string, name?: string): this
    cc (address: string, name?: string): this
    bcc (address: string, name?: string): this
    messageId (messageId: string): this
    subject (message: string): this

    /**
     * Routing options
     */
    replyTo (address: string, name?: string): this
    inReplyTo (messageId: string): this
    references (messagesIds: string[]): this
    envelope (envelope: EnvolpeNode): this
    priority (priority: 'low' | 'normal' | 'high'): this

    /**
     * Content options
     */
    encoding (encoding: string): this
    htmlView (template: string, data?: any): this
    textView (template: string, data?: any): this
    watchView (template: string, data?: any): this
    html (content: string): this
    text (content: string): this
    watch (content: string): this

    /**
     * Attachments
     */
    attach (filePath: string, options: AttachmentOptionsNode): this
    attachData (content: Readable | Buffer, options: AttachmentOptionsNode): this
    embed (filePath: string, cid: string, options: AttachmentOptionsNode)
    embedData (content: Readable | Buffer, cid: string, options: AttachmentOptionsNode)

    header (key: string, value: string | string[]): this
    preparedHeader (key: string, value: string | string[]): this

    toJSON (): MessageNode
  }

  /**
   * A shortcut someone to define `config` and `implementation` keys on the
   * `MailersList` interface. Using this type is not mandatory and one can
   * define the underlying keys by themselves. For example:
   *
   * ```
   * MailersList: {
   *   transactional: {
   *     config: SmtpConfigContract,
   *     implementation: SmtpDriverContract,
   *   }
   * }
   * ```
   *
   * The shortcut is
   *
   * ```
   * MailersList: {
   *   transactional: MailDrivers['smtp']
   * }
   * ```
   */
  export type MailDrivers = {
    smtp: {
      config: SmtpConfigContract,
      implementation: SmtpDriverContract,
    },
  }

  /**
   * Using declaration merging, one must extend this interface.
   * --------------------------------------------------------
   * MUST BE SET IN THE USER LAND.
   * --------------------------------------------------------
   */
  export interface MailersList {
  }

  /**
   * Shape of the mailer config computed from the `MailersList` interface.
   * The `MailersList` is extended in the user codebase.
   */
  export type MailerConfigContract = {
    mailer: string,
    mailers: { [P in keyof MailersList]: MailersList[P]['config'] },
  }

  /**
   * Shape of the callback passed to the `send` method to compose the
   * message
   */
  export type MessageComposeCallback = (message: MessageContract) => void | Promise<void>

  /**
   * Mailer exposes the unified API to send emails by using a given
   * driver
   */
  export interface MailerContract<Driver extends any = MailDriverContract, Config extends any = any> {
    name: string
    driver: Driver
    onClose: ((mailer: MailerContract) => void),
    send (callback: MessageComposeCallback, config?: Config): ReturnType<Driver['send']>
    close (): Promise<void>
  }

  /*
  |--------------------------------------------------------------------------
  | SMTP driver
  |--------------------------------------------------------------------------
  |
  | Interfaces and types for the SMTP Driver
  |
  */

  /**
   * Login options for Oauth2 smtp login
   */
  export type SmtpOauth2 = {
    type: 'OAuth2',
    user: string,
    clientId: string,
    clientSecret: string,
    refreshToken?: string,
    accessToken?: string,
    expires?: string | number,
    accessUrl?: string,
  }

  /**
   * Login options for simple smtp login
   */
  export type SmtpSimpleAuth = {
    type: 'login',
    user: string,
    pass: string,
  }

  /**
   * Smtp driver config
   */
  export type SmtpConfigContract = {
    host: string,
    driver: 'smtp',
    port?: number | string,
    secure?: boolean,

    /**
     * Authentication
     */
    auth?: SmtpSimpleAuth | SmtpOauth2,

    /**
     * TLS options
     */
    tls?: TlsOptions,
    ignoreTLS?: boolean,
    requireTLS?: boolean,

    /**
     * Pool options
     */
    pool?: boolean,
    maxConnections?: number,
    maxMessages?: number,
    rateDelta?: number,
    rateLimit?: number,

    /**
     * Proxy
     */
    proxy?: string,
  }

  /**
   * Shape of mail response for the smtp driver
   */
  export type SmtpMailResponse = {
    response: string
    accepted: string[]
    rejected: string[]
    envelope: {
      from: string,
      to: string[],
      cc?: string[],
      bcc?: string[],
    }
    messageId: string,
  }

  /**
   * Shape of the smtp driver
   */
  export interface SmtpDriverContract extends MailDriverContract {
    send (message: MessageNode, config?: SmtpConfigContract): Promise<SmtpMailResponse>
  }

  /**
   * Shape of the mailer
   */
  export interface MailManagerContract<
    DefaultDriver = MailDriverContract
  > extends ManagerContract
    <
    MailDriverContract,
    MailerContract<MailDriverContract>,
    { [P in keyof MailersList]: MailerContract<MailersList[P]['implementation'], MailersList[P]['config']> }
    > {
    send (
      callback: MessageComposeCallback,
      config?: any,
    ): ReturnType<MailDriverContract['send']>
    close (name?: string): Promise<void>
    closeAll (): Promise<void>
  }

  const Mail: MailManagerContract
  export default Mail
}
