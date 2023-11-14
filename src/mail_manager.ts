/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Emitter } from '@adonisjs/core/events'
import { RuntimeException } from '@poppinss/utils'

import debug from './debug.js'
import { Mailer } from './mailer.js'
import { FakeMailer } from './fake_mailer.js'
import type {
  MailEvents,
  MailerConfig,
  MailerMessenger,
  MailDriverContract,
  MailerTemplateEngine,
  MessageComposeCallback,
  MailManagerDriverFactory,
} from './types.js'
import { BaseMail } from './base_mail.js'

/**
 * Mail manager exposes the API to configure multiple mailers, manage
 * their lifecycle and switch between them.
 */
export class MailManager<KnownMailers extends Record<string, MailManagerDriverFactory>> {
  #emitter: Emitter<MailEvents>
  #config: MailerConfig & {
    default?: keyof KnownMailers
    mailers: KnownMailers
  }

  /**
   * Messenger to use on all mailers created
   * using the mail manager
   */
  #messenger?: (mailer: Mailer<MailDriverContract>) => MailerMessenger

  /**
   * Template engine to use on all mailers created
   * using the mail manager
   */
  #templateEngine?: MailerTemplateEngine

  /**
   * Reference to the fake mailer (if any)
   */
  #fakeMailer?: FakeMailer

  /**
   * Cache of mailers
   */
  #mailersCache: Partial<Record<keyof KnownMailers, Mailer<MailDriverContract>>> = {}

  constructor(
    emitter: Emitter<MailEvents>,
    config: MailerConfig & {
      default?: keyof KnownMailers
      mailers: KnownMailers
    }
  ) {
    debug('creating mail manager %O', config)
    this.#emitter = emitter
    this.#config = config
  }

  /**
   * Configure the messenger for all the mailers managed
   * by the mail manager class.
   */
  setMessenger(messenger: (mailer: Mailer<MailDriverContract>) => MailerMessenger): this {
    this.#messenger = messenger
    Object.keys(this.#mailersCache).forEach((name) => {
      const mailer = this.#mailersCache[name]!
      mailer.setMessenger(messenger(mailer))
    })
    return this
  }

  /**
   * Configure the template engine to use for all the
   * mailers managed by the mail manager class.
   */
  setTemplateEngine(engine: MailerTemplateEngine): this {
    this.#templateEngine = engine
    Object.keys(this.#mailersCache).forEach((name) => {
      this.#mailersCache[name]!.setTemplateEngine(engine)
    })
    return this
  }

  /**
   * Send email using the default mailer
   */
  send(callbackOrMail: MessageComposeCallback | BaseMail, config?: unknown) {
    return this.use().send(callbackOrMail, config)
  }

  /**
   * Queue email using the default mailer
   */
  async sendLater(callbackOrMail: MessageComposeCallback | BaseMail, config?: unknown) {
    await this.use().sendLater(callbackOrMail, config)
  }

  /**
   * Create/use an instance of a known mailer. The mailer
   * instances are cached for the lifecycle of the process
   */
  use<K extends keyof KnownMailers>(mailerName?: K): Mailer<ReturnType<KnownMailers[K]>> {
    let mailerToUse: keyof KnownMailers | undefined = mailerName || this.#config.default

    if (!mailerToUse) {
      throw new RuntimeException(
        'Cannot create mailer instance. No default mailer is defined in the config'
      )
    }
    if (!this.#config.mailers[mailerToUse]) {
      throw new RuntimeException(
        `Unknow mailer "${String(mailerToUse)}". Make sure it is configured inside the config file`
      )
    }

    /**
     * Return fake mailer if one exists
     */
    if (this.#fakeMailer) {
      return this.#fakeMailer as unknown as Mailer<ReturnType<KnownMailers[K]>>
    }

    /**
     * Use cached copy if exists
     */
    const cachedMailer = this.#mailersCache[mailerToUse]
    if (cachedMailer) {
      debug('using mailer from cache. name: "%s"', cachedMailer)
      return cachedMailer as Mailer<ReturnType<KnownMailers[K]>>
    }

    /**
     * Create driver instance using the factory
     */
    const driverFactory = this.#config.mailers[mailerToUse]

    /**
     * Create mailer instance with the driver
     */
    debug('creating mailer driver. name: "%s"', mailerToUse)
    const mailer = new Mailer(mailerToUse as string, driverFactory(), this.#emitter, this.#config)
    if (this.#messenger) {
      mailer.setMessenger(this.#messenger(mailer))
    }
    if (this.#templateEngine) {
      mailer.setTemplateEngine(this.#templateEngine)
    }

    /**
     * Cache it
     */
    this.#mailersCache[mailerToUse] = mailer

    return mailer as Mailer<ReturnType<KnownMailers[K]>>
  }

  /**
   * Turn on fake mode. After this all calls to "mail.use" will
   * return an instance of the fake mailer
   */
  fake(): FakeMailer {
    this.restore()

    debug('creating fake mailer')
    this.#fakeMailer = new FakeMailer('fake', this.#emitter, this.#config)
    return this.#fakeMailer
  }

  /**
   * Turn off fake mode and restore normal behavior
   */
  restore() {
    if (this.#fakeMailer) {
      this.#fakeMailer.close()
      this.#fakeMailer = undefined
      debug('restoring mailer fake')
    }
  }

  /**
   * Clear mailer from cache and close its transport
   */
  async close<K extends keyof KnownMailers>(mailerName: K) {
    const mailer = this.#mailersCache[mailerName]!
    if (mailer) {
      await mailer.close()
      delete this.#mailersCache[mailerName]
    }
  }

  /**
   * Clear all mailers from cache and close their transports
   */
  async closeAll() {
    await Promise.all(Object.keys(this.#mailersCache).map((mailerName) => this.close(mailerName)))
  }
}
