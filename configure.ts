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
    smtp: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD'],
    ses: ['SES_ACCESS_KEY', 'SES_ACCESS_SECRET', 'SES_REGION'],
    mailgun: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
    sparkpost: ['SPARKPOST_API_KEY'],
    resend: ['RESEND_API_KEY'],
  }

  const drivers = await command.prompt.multiple('Select the mail services you want to use', [
    'smtp',
    'ses',
    'resend',
    'mailgun',
    'sparkpost',
  ])

  /**
   * Publish config file
   */
  await command.publishStub('config.stub', {
    drivers: drivers,
  })

  const codemods = await command.createCodemods()

  /**
   * Publish provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/mail/mail_provider')
  })

  /**
   * Define env variables for the selected drivers
   */
  await codemods.defineEnvVariables(
    drivers.reduce<Record<string, string>>((result, driver) => {
      envVariables[driver].forEach((envVariable) => {
        result[envVariable] = ''
      })
      return result
    }, {})
  )

  /**
   * Define env variables validation for the selected drivers
   */
  await codemods.defineEnvValidations({
    leadingComment: 'Variables for configuring the mail package',
    variables: drivers.reduce<Record<string, string>>((result, driver) => {
      envVariables[driver].forEach((envVariable) => {
        result[envVariable] = 'Env.schema.string()'
      })
      return result
    }, {}),
  })
}
