/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/Mail' {
  import { ManagerContract } from '@poppinss/manager'
  import { Readable } from 'stream'
  import { TlsOptions } from 'tls'

  /**
   * Shape of the driver contract
   */
  export interface DriverContract {
    send (message: MessageNode): Promise<any>
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
  export type EnvolpeNode = {
    from?: string,
    to?: string,
    cc?: string,
    bcc?: string,
  }

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
    attachments?: (AttachmentOptionsNode & {
      path?: string,
      cid?: string,
      content?: Buffer | Readable,
    })[],
    headers?: (
      | {
        [key: string]: string | string[],
      }
      | {
        [key: string]: { prepared: true, value: string | string[] },
      }
    )[],
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

    encoding (encoding: string): this
    priority (priority: 'low' | 'normal' | 'high'): this

    /**
     * Content options
     */
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
    attachData (
      content: Readable | Buffer,
      options: AttachmentOptionsNode,
    ): this
    embed (filePath: string, cid: string, options: AttachmentOptionsNode)
    embedData (
      content: Readable | Buffer,
      cid: string,
      options: AttachmentOptionsNode,
    )

    header (key: string, value: string | string[]): this
    preparedHeader (key: string, value: string | string[]): this

    toJSON (): MessageNode
  }

  /**
   * Mailers will be extended in the user land.
   */
  export interface MailersList {
    smtp: {
      config: SmtpConfigContract,
      implementation: SmtpDriverContract,
    }
    ses: {
      config: SesConfigContract,
      implementation: SesDriverContract,
    }
  }

  /**
   * Shape of the mailer config computed from the `MailersList` interface.
   * The `MailersList` is extended in the user codebase.
   */
  export type MailerConfigContract = {
    mailer: keyof MailersList,
    mailers: { [P in keyof MailersList]: MailersList[P]['config'] },
  }

  /**
   * Shape of the callback passed to the `send` method to compose the
   * message
   */
  export type MessageComposeCallback = (
    message: MessageContract,
  ) => void | Promise<void>

  /**
   * Mailer exposes the unified API to send emails by using a given
   * driver
   */
  export interface MailerContract<Driver extends any = DriverContract> {
    name: string // name of the mapping for which the mailer is created
    send (callback: MessageComposeCallback): ReturnType<Driver['send']>
    close (): Promise<void>
  }

  /**
   * Shape of the mailer
   */
  export interface MailManagerContract
    extends ManagerContract<
    DriverContract, // Shape of drivers, required for extend
    MailerContract, // The output of `use` method
    {
      [P in keyof MailersList]: MailerContract<
        MailersList[P]['implementation']
      >
    }
    > {
    send (callback: MessageComposeCallback): ReturnType<DriverContract['send']>
    close (name?: string): Promise<void>
    closeAll (): Promise<void>
  }

  /*
  |--------------------------------------------------------------------------
  | SMTP driver
  |--------------------------------------------------------------------------
  |
  | Smtp driver contracts
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
    response: string,
    accepted: string[],
    rejected: string[],
    envelope: {
      from: string,
      to: string[],
      cc?: string[],
      bcc?: string[],
    },
    messageId: string,
  }

  /**
   * Shape of the smtp driver
   */
  export interface SmtpDriverContract extends DriverContract {
    send (message: MessageNode): Promise<SmtpMailResponse>
  }

  /**
   * Ses driver config
   */
  export type SesConfigContract = {
    driver: string,
    key: string,
    secret: string,
    region: string,
    sendingRate?: number,
    maxConnections?: number,
  }

  /**
   * Shape of mail response for the ses driver
   */
  export type SesMailResponse = {
    response: string,
    accepted: string[],
    rejected: string[],
    envelope: {
      from: string,
      to: string[],
      cc?: string[],
      bcc?: string[],
    },
    messageId: string,
  }

  /**
   * Shape of the ses driver
   */
  export interface SesDriverContract extends DriverContract {
    send (message: MessageNode): Promise<SmtpMailResponse>
  }

  const Mail: MailManagerContract
  export default Mail
}
