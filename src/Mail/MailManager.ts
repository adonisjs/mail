/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/mail.ts" />

import { Hooks } from '@poppinss/hooks'
import { Manager } from '@poppinss/manager'
import { IocContract } from '@adonisjs/fold'
import { ManagerConfigValidator } from '@poppinss/utils'

import {
	BaseConfig,
	MailConfig,
	MailersList,
	TrapCallback,
	MailerContract,
	AfterSendHandler,
	BeforeSendHandler,
	MailDriverContract,
	MailManagerContract,
	MessageComposeCallback,
} from '@ioc:Adonis/Addons/Mail'

import { ViewContract } from '@ioc:Adonis/Core/View'

import { Mailer } from './Mailer'

/**
 * The manager exposes the API to pull instance of [[Mailer]] class for pre-defined mappings
 * in the config file. The manager internally manages the state of mappings and cache
 * them for re-use.
 */
export class MailManager
	extends Manager<
		IocContract,
		MailDriverContract,
		MailerContract<keyof MailersList>,
		{
			[P in keyof MailersList]: MailerContract<keyof MailersList>
		}
	>
	implements MailManagerContract {
	/**
	 * Caching driver instances. One must call `close` to clean it up
	 */
	protected singleton = true

	/**
	 * Reference to the fake driver
	 */
	private fakeMailer?: MailerContract<any>

	/**
	 * Reference to the hooks
	 */
	public hooks = new Hooks(this.container.getResolver(undefined, 'mailerHooks', 'App/Mailers/Hooks'))

	constructor(container: IocContract, private config: MailConfig, public view: ViewContract) {
		super(container)
		this.validateConfig()
	}

	/**
	 * Validate config at runtime
	 */
	private validateConfig() {
		const validator = new ManagerConfigValidator(this.config, 'mail', 'config/mail')
		validator.validateDefault('mailer')
		validator.validateList('mailers', 'mailer')
	}

	/**
	 * Since we don't expose the drivers instances directly, we wrap them
	 * inside the mailer instance.
	 */
	protected wrapDriverResponse<Name extends keyof MailersList>(
		mappingName: Name,
		driver: MailDriverContract
	): MailerContract<Name> {
		return new Mailer(mappingName, this, driver)
	}

	/**
	 * Returns the driver name for a given mapping
	 */
	protected getMappingDriver(name: string) {
		const config = this.getMappingConfig(name)
		return config && config.driver
	}

	/**
	 * Returns the config for a given mapping
	 */
	protected getMappingConfig(name: string) {
		return this.config.mailers[name]
	}

	/**
	 * Returns the name of the default mapping
	 */
	protected getDefaultMappingName() {
		return this.config.mailer
	}

	/**
	 * Creates an instance of `smtp` driver by lazy loading. This method
	 * is invoked internally when a new driver instance is required
	 */
	protected createSmtp(_: string, config: any) {
		const { SmtpDriver } = require('../Drivers/Smtp')
		return new SmtpDriver(config)
	}

	/**
	 * Creates an instance of `ses` driver by lazy loading. This method
	 * is invoked internally when a new driver instance is required
	 */
	protected createSes(_: string, config: any) {
		const { SesDriver } = require('../Drivers/Ses')
		return new SesDriver(config)
	}

	/**
	 * Fake email calls
	 */
	public trap(callback: TrapCallback) {
		const { FakeDriver } = require('../Drivers/Fake')
		this.fakeMailer = this.wrapDriverResponse('fake' as any, new FakeDriver(callback))
	}

	/**
	 * Restore previously fake driver
	 */
	public restore() {
		this.fakeMailer = undefined
	}

	/**
	 * Register a before hook
	 */
	public before(event: 'send', handler: BeforeSendHandler<keyof MailersList>) {
		this.hooks.add('before', event, handler)
		return this
	}

	/**
	 * Register an after hook
	 */
	public after(event: 'send', handler: AfterSendHandler<keyof MailersList>) {
		this.hooks.add('after', event, handler)
		return this
	}

	/**
	 * Sends email using the default `mailer`
	 */
	public async send(callback: MessageComposeCallback, metaOptions?: BaseConfig['meta']) {
		if (this.fakeMailer) {
			return this.fakeMailer.send(callback, metaOptions)
		}
		return this.use().send(callback, metaOptions)
	}

	/**
	 * Use a named or the default mailer
	 */
	public use(name?: keyof MailersList) {
		if (this.fakeMailer) {
			return this.fakeMailer
		}

		return name ? super.use(name) : super.use()
	}

	/**
	 * Closes the mapping instance and removes it from the cache
	 */
	public async close(name?: keyof MailersList): Promise<void> {
		const mailer = name ? this.use(name) : this.use()
		await mailer.close()
	}

	/**
	 * Closes the mapping instance and removes it from the cache
	 */
	public async closeAll(): Promise<void> {
		await Promise.all(Array.from(this['mappingsCache'].keys()).map((name: string) => this.close(name as any)))
	}
}
