/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  const envVariables = {
    smtp: ['SMTP_HOST', 'SMTP_PORT'],
    ses: ['SES_ACCESS_KEY', 'SES_ACCESS_SECRET', 'SES_REGION'],
    mailgun: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
    sparkpost: ['SPARKPOST_API_KEY'],
    resend: ['RESEND_API_KEY'],
    brevo: ['BREVO_API_KEY'],
  }

  const transports = await command.prompt.multiple('Select the mail services you want to use', [
    'smtp',
    'ses',
    'resend',
    'mailgun',
    'sparkpost',
    'brevo',
  ])

  /**
   * Publish config file
   */
  await command.publishStub('config.stub', {
    transports: transports,
  })

  const codemods = await command.createCodemods()

  /**
   * Publish provider and command
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/mail/mail_provider')
    rcFile.addCommand('@adonisjs/mail/commands')
  })

  /**
   * Define env variables for the selected transports
   */
  await codemods.defineEnvVariables(
    transports.reduce<Record<string, string>>((result, transport) => {
      envVariables[transport].forEach((envVariable) => {
        result[envVariable] = ''
      })
      return result
    }, {})
  )

  /**
   * Define env variables validation for the selected transports
   */
  await codemods.defineEnvValidations({
    leadingComment: 'Variables for configuring the mail package',
    variables: transports.reduce<Record<string, string>>((result, transport) => {
      envVariables[transport].forEach((envVariable) => {
        result[envVariable] = 'Env.schema.string()'
      })
      return result
    }, {}),
  })
}
