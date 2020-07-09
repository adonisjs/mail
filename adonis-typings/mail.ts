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
	import { IocContract } from '@adonisjs/fold'
	import { ManagerContract } from '@poppinss/manager'
	import { ProfilerContract, ProfilerRowContract } from '@ioc:Adonis/Core/Profiler'

	/*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

	/**
	 * Unwraps value of a promise type
	 */
	export type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : T

	/**
	 * Infers the response type of a driver
	 */
	export type DriverResponseType<Driver> = Driver extends MailDriverContract
		? UnwrapPromise<ReturnType<Driver['send']>>
		: never

	/**
	 * Infers the response type of a mailer
	 */
	export type MailerResponseType<Name extends keyof MailersList> = DriverResponseType<
		MailersList[Name]['implementation']
	>

	/**
	 * Infers the 2nd argument accepted by the driver send method
	 */
	export type DriverOptionsType<Driver> = Driver extends MailDriverContract ? Parameters<Driver['send']>[1] : never

	/*
  |--------------------------------------------------------------------------
  | Message
  |--------------------------------------------------------------------------
  */

	/**
	 * Attachment options
	 */
	export type AttachmentOptionsNode = {
		filename?: string
		href?: string
		httpHeaders?: { [key: string]: any }
		contentType?: string
		contentDisposition?: string
		encoding?: string
		headers?: { [key: string]: any }
	}

	/**
	 * Shape of envolpe
	 */
	export type EnvolpeNode = { from?: string; to?: string; cc?: string; bcc?: string }
	export type PostSendEnvolpeNode = { from: string; to: string[] }
	export type RecipientNode = { address: string; name?: string }

	/**
	 * Message node is compatible with nodemailer `sendMail` method
	 */
	export type MessageNode = {
		from?: RecipientNode
		to?: RecipientNode[]
		cc?: RecipientNode[]
		bcc?: RecipientNode[]
		messageId?: string
		subject?: string
		replyTo?: RecipientNode
		inReplyTo?: string
		references?: string[]
		encoding?: string
		priority?: 'low' | 'normal' | 'high'
		envelope?: EnvolpeNode
		attachments?: (AttachmentOptionsNode & { path?: string; cid?: string; content?: Buffer | Readable })[]
		headers?: (
			| {
					[key: string]: string | string[]
			  }
			| {
					[key: string]: { prepared: true; value: string | string[] }
			  }
		)[]
		html?: string
		watch?: string
		text?: string
	}

	/**
	 * Shape of the message instance passed to `send` method callback
	 */
	export interface MessageContract {
		/**
		 * The content for the message.
		 */
		content: {
			html?: string
			text?: string
			watch?: string
		}

		/**
		 * Path to the views used to generate content for the
		 * message
		 */
		contentViews: {
			html?: string
			text?: string
			watch?: string
		}

		/**
		 * Common fields
		 */
		to(address: string, name?: string): this
		from(address: string, name?: string): this
		cc(address: string, name?: string): this
		bcc(address: string, name?: string): this
		messageId(messageId: string): this
		subject(message: string): this

		/**
		 * Routing options
		 */
		replyTo(address: string, name?: string): this
		inReplyTo(messageId: string): this
		references(messagesIds: string[]): this
		envelope(envelope: EnvolpeNode): this
		priority(priority: 'low' | 'normal' | 'high'): this

		/**
		 * Content options
		 */
		encoding(encoding: string): this
		htmlView(template: string, data?: any): this
		textView(template: string, data?: any): this
		watchView(template: string, data?: any): this
		html(content: string): this
		text(content: string): this
		watch(content: string): this

		/**
		 * Attachments
		 */
		attach(filePath: string, options: AttachmentOptionsNode): this
		attachData(content: Readable | Buffer, options: AttachmentOptionsNode): this
		embed(filePath: string, cid: string, options: AttachmentOptionsNode): this
		embedData(content: Readable | Buffer, cid: string, options: AttachmentOptionsNode): this

		header(key: string, value: string | string[]): this
		preparedHeader(key: string, value: string | string[]): this

		toJSON(): MessageNode
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

	/*
  |--------------------------------------------------------------------------
  | Config Helpers
  |--------------------------------------------------------------------------
  */

	/**
	 * A shortcut to define `config` and `implementation` keys on the
	 * `MailersList` interface. Using this type is not mandatory and
	 * one can define the underlying keys by themselves.
	 * For example:
	 *
	 * ```
	 * MailersList: {
	 *   transactional: {
	 *     config: SmtpConfig,
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
			config: SmtpConfig
			implementation: SmtpDriverContract
		}
		ses: {
			config: SesConfig
			implementation: SesDriverContract
		}
		mailgun: {
			config: MailgunConfig
			implementation: MailgunDriverContract
		}
	}

	/**
	 * Using declaration merging, one must extend this interface.
	 * --------------------------------------------------------
	 * MUST BE SET IN THE USER LAND.
	 * --------------------------------------------------------
	 */
	export interface MailersList {}

	/*
  |--------------------------------------------------------------------------
  | Mailer Config
  |--------------------------------------------------------------------------
  */

	/**
	 * Shape of the mailer config computed from the `MailersList` interface.
	 * The `MailersList` is extended in the user codebase.
	 */
	export type MailConfig = {
		mailer: keyof MailersList
		mailers: { [P in keyof MailersList]: MailersList[P]['config'] }
	}

	/*
  |--------------------------------------------------------------------------
  | SMTP driver
  |--------------------------------------------------------------------------
  */

	/**
	 * Login options for Oauth2 smtp login
	 */
	export type SmtpOauth2 = {
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
	 * Login options for simple smtp login
	 */
	export type SmtpSimpleAuth = {
		type: 'login'
		user: string
		pass: string
	}

	/**
	 * Smtp driver config
	 */
	export type SmtpConfig = {
		host: string
		driver: 'smtp'
		port?: number | string
		secure?: boolean

		/**
		 * Authentication
		 */
		auth?: SmtpSimpleAuth | SmtpOauth2

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

	/**
	 * Shape of mail response for the smtp driver
	 */
	export type SmtpMailResponse = {
		response: string
		accepted: string[]
		rejected: string[]
		envelope: PostSendEnvolpeNode
		messageId: string
	}

	/**
	 * Shape of the smtp driver
	 */
	export interface SmtpDriverContract extends MailDriverContract {
		send(message: MessageNode): Promise<SmtpMailResponse>
	}

	/*
  |--------------------------------------------------------------------------
  | SES driver
  |--------------------------------------------------------------------------
  */

	/**
	 * Ses driver config
	 */
	export type SesConfig = {
		driver: 'ses'
		apiVersion: string
		key: string
		secret: string
		region: string
		sslEnabled?: boolean
		sendingRate?: number
		maxConnections?: number
	}

	/**
	 * Shape of mail response for the ses driver
	 */
	export type SesMailResponse = {
		response: string
		accepted: string[]
		rejected: string[]
		envelope: PostSendEnvolpeNode
		messageId: string
	}

	/**
	 * Shape of the ses driver
	 */
	export interface SesDriverContract extends MailDriverContract {
		send(message: MessageNode): Promise<SesMailResponse>
	}

	/*
  |--------------------------------------------------------------------------
  | Mailgun driver
  |--------------------------------------------------------------------------
  */

	/**
	 * Ses driver config
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

	export type MailgunConfig = MailgunRuntimeConfig & {
		driver: 'mailgun'
		baseUrl: string
		key: string
		domain?: string
		oDkim?: boolean
	}

	/**
	 * Shape of mail response for the mailgun driver
	 */
	export type MailgunResponse = {
		envelope: PostSendEnvolpeNode
		messageId: string
	}

	/**
	 * Shape of the mailgun driver
	 */
	export interface MailgunDriverContract extends MailDriverContract {
		send(message: MessageNode, config?: MailgunRuntimeConfig): Promise<MailgunResponse>
	}

	/*
  |--------------------------------------------------------------------------
  | Fake driver
  |--------------------------------------------------------------------------
  */

	/**
	 * Shape of mail response for the fake driver
	 */
	export type FakeMailResponse = {
		messageId: string
		message: MessageNode
		envelope: PostSendEnvolpeNode
	}

	/**
	 * Shape of the faker driver
	 */
	export interface FakeDriverContract extends MailDriverContract {
		send(message: MessageNode): Promise<FakeMailResponse>
	}

	/*
  |--------------------------------------------------------------------------
  | Mailer & Manager
  |--------------------------------------------------------------------------
  */

	export type TrapCallback = (message: MessageNode) => any

	/**
	 * Data emitted by the `adonis:mail:sent` event
	 */
	export type MailEventData = {
		message: MessageContract
		mailer: keyof MailersList | 'fake' | 'ethereal'
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
	export interface MailerContract<Name extends keyof MailersList> {
		/**
		 * Mailer name
		 */
		readonly name: Name

		/**
		 * The driver in use
		 */
		readonly driver: MailersList[Name]['implementation']

		/**
		 * Send email
		 */
		send(
			callback: MessageComposeCallback,
			config?: DriverOptionsType<MailersList[Name]['implementation']>,
			profiler?: ProfilerContract | ProfilerRowContract
		): Promise<MailerResponseType<Name>>

		/**
		 * Close mailer
		 */
		close(): Promise<void>
	}

	/**
	 * Shape of the mailer
	 */
	export interface MailManagerContract
		extends ManagerContract<
			IocContract,
			MailDriverContract,
			MailerContract<keyof MailersList>,
			{ [P in keyof MailersList]: MailerContract<P> }
		> {
		/**
		 * Trap emails
		 */
		trap(callback: TrapCallback): void

		/**
		 * Restore trap
		 */
		restore(): void

		/**
		 * Pretty print mailer event data
		 */
		prettyPrint: (mail: MailEventData) => void

		/**
		 * Send email using the default mailer
		 */
		send(
			callback: MessageComposeCallback,
			profiler?: ProfilerContract | ProfilerRowContract
		): ReturnType<MailDriverContract['send']>

		/**
		 * Preview email using ethereal.email
		 */
		preview(
			callback: MessageComposeCallback,
			profiler?: ProfilerContract | ProfilerRowContract
		): Promise<SmtpMailResponse & { account: { user: string; pass: string } }>

		/**
		 * Close mailer
		 */
		close(name?: string): Promise<void>

		/**
		 * Close all mailers
		 */
		closeAll(): Promise<void>
	}

	const Mail: MailManagerContract
	export default Mail
}
