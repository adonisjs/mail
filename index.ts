/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export * as errors from './src/errors.js'

export { Mailer } from './src/mailer.js'
export { Message } from './src/message.js'
export { configure } from './configure.js'
export { stubsRoot } from './stubs/main.js'
export { BaseMail } from './src/base_mail.js'
export { FakeMailer } from './src/fake_mailer.js'
export { MailManager } from './src/mail_manager.js'
export { MailResponse } from './src/mail_response.js'
export { defineConfig, transports } from './src/define_config.js'
