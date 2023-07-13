import { AppFactory } from '@adonisjs/core/factories/app'
import { MailManagerFactory } from '../factories/mail_manager.js'
import { ManagerDriverFactory } from '../src/define_config.js'
import { SmtpDriver } from '../src/drivers/smtp/driver.js'
import { MailDriverContract, MessageNode, RecipientNode } from '../src/types/main.js'

export const BASE_URL = new URL('./tmp/', import.meta.url)

/**
 * Custom driver used for testing. It store the message and options
 * on the class instance for assertions
 */
export class CustomDriver implements MailDriverContract {
  message: MessageNode | null = null
  options: any = null

  async send(message: any, options: any) {
    this.message = message
    this.options = options
  }

  async close() {}
}

/**
 * Same as the CustomDriver but async send method
 */
export class CustomDriverAsync implements MailDriverContract {
  message: MessageNode | null = null
  options: any = null

  async send(message: any, options: any) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.message = message
        this.options = options
        resolve()
      }, 1000)
    })
  }

  async close() {}
}

export async function createMailManager<
  KnownMailers extends Record<string, ManagerDriverFactory> = {
    smtp: () => SmtpDriver
  },
>(config?: { default?: keyof KnownMailers; list: KnownMailers; from?: RecipientNode }) {
  const app = new AppFactory().create(BASE_URL, () => {})

  let factory = new MailManagerFactory<KnownMailers>()
  if (config) factory = factory.merge(config)
  const manager = factory.create(app)

  await app.init()
  await app.boot()

  return { app, manager }
}
