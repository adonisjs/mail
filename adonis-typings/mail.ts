/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/Mail' {
	import { Readable } from 'stream'
	import { TlsOptions } from 'tls'
	import { IocContract } from '@adonisjs/fold'
	import { ManagerContract } from '@poppinss/manager'

	/**
	 * Shape of base config contract
	 */
	export type BaseConfigContract = {
		meta?: {
			[key: string]: any
		}
	}

	/**
	 * Shape of the driver contract. Each driver must adhere to
	 * this interface
	 */
	export interface MailDriverContract {
		send(message: MessageNode, config?: any): Promise<any>
		close(): void | Promise<void>
	}

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

	/**
	 * Message node is compatible with nodemailer `sendMail` method
	 */
	export type MessageNode = {
		from?: { address: string; name?: string }
		to?: { address: string; name?: string }[]
		cc?: { address: string; name?: string }[]
		bcc?: { address: string; name?: string }[]
		messageId?: string
		subject?: string
		replyTo?: { address: string; name?: string }
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

	/**
	 * A shortcut to define `config` and `implementation` keys on the
	 * `MailersList` interface. Using this type is not mandatory and
	 * one can define the underlying keys by themselves.
	 * For example:
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
			config: SmtpConfigContract
			implementation: SmtpDriverContract
		}
		ses: {
			config: SesConfigContract
			implementation: SesDriverContract
		}
	}

	/**
	 * Using declaration merging, one must extend this interface.
	 * --------------------------------------------------------
	 * MUST BE SET IN THE USER LAND.
	 * --------------------------------------------------------
	 */
	export interface MailersList {}

	/**
	 * Shape of the mailer config computed from the `MailersList` interface.
	 * The `MailersList` is extended in the user codebase.
	 */
	export type MailerConfigContract = {
		mailer: keyof MailersList
		mailers: { [P in keyof MailersList]: MailersList[P]['config'] }
	}

	/**
	 * Unwraps value of a promise type
	 */
	export type UnwrapPromise<T> = T extends PromiseLike<infer U> ? U : T

	/**
	 * Infers return type of a driver
	 */
	export type DriverReturnType<Driver> = Driver extends MailDriverContract
		? UnwrapPromise<ReturnType<Driver['send']>>
		: never

	/**
	 * Shape of the callback passed to the `send` method to compose the
	 * message
	 */
	export type MessageComposeCallback = (message: MessageContract) => void | Promise<void>

	/**
	 * Hook handler for `beforeSend`
	 */
	export type BeforeSendHandler<Name extends keyof MailersList> =
		| string
		| ((mailer: MailerContract<Name>, message: MessageContract) => void | Promise<void>)

	/**
	 * Hook handler for `afterSend`
	 */
	export type AfterSendHandler<Name extends keyof MailersList> =
		| string
		| ((
				mailer: MailerContract<Name>,
				response: DriverReturnType<MailersList[Name]['implementation']>
		  ) => void | Promise<void>)

	/**
	 * Mailer exposes the unified API to send emails by using a given
	 * driver
	 */
	export interface MailerContract<Name extends keyof MailersList> {
		name: Name
		driver: MailersList[Name]['implementation']
		send(
			callback: MessageComposeCallback,
			metaOptions?: MailersList[Name]['config']['meta']
		): Promise<DriverReturnType<MailersList[Name]['implementation']>>
		close(): Promise<void>
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
	export type SmtpConfigContract = BaseConfigContract & {
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
		envelope: {
			from: string
			to: string[]
			cc?: string[]
			bcc?: string[]
		}
		messageId: string
	}

	/**
	 * Shape of the smtp driver
	 */
	export interface SmtpDriverContract extends MailDriverContract {
		send(message: MessageNode, metaOptions?: SmtpConfigContract['meta']): Promise<SmtpMailResponse>
	}

	/*
  |--------------------------------------------------------------------------
  | SES driver
  |--------------------------------------------------------------------------
  |
  | Interfaces and types for the SES Driver
  |
  */

	/**
	 * Ses driver config
	 */
	export type SesConfigContract = BaseConfigContract & {
		driver: string
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
		envelope: {
			from: string
			to: string[]
			cc?: string[]
			bcc?: string[]
		}
		messageId: string
	}

	/**
	 * Shape of the ses driver
	 */
	export interface SesDriverContract extends MailDriverContract {
		send(message: MessageNode, metaOptions?: SesConfigContract['meta']): Promise<SesMailResponse>
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
		before(event: 'send', handler: BeforeSendHandler<keyof MailersList>): this
		after(event: 'send', handler: AfterSendHandler<keyof MailersList>): this
		send(
			callback: MessageComposeCallback,
			metaOptions?: BaseConfigContract['meta']
		): ReturnType<MailDriverContract['send']>
		close(name?: string): Promise<void>
		closeAll(): Promise<void>
	}

	const Mail: MailManagerContract
	export default Mail
}
