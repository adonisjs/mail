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
 * Prompt choices for the mail driver selection
 */
const DRIVER_PROMPTS = [
  { name: 'smtp' as const, message: 'SMTP' },
  { name: 'ses' as const, message: 'Amazon SES' },
  { name: 'mailgun' as const, message: 'Mailgun' },
  { name: 'sparkpost' as const, message: 'SparkPost' },
]

/**
 * Environment variables for available drivers
 */
const DRIVER_ENV_VALUES = {
  smtp: {
    SMTP_HOST: 'localhost',
    SMTP_PORT: '587',
    SMTP_USERNAME: '<username>',
    SMTP_PASSWORD: '<password>',
  },
  ses: {
    SES_ACCESS_KEY: '<aws-access-key>',
    SES_ACCESS_SECRET: '<aws-secret>',
    SES_REGION: 'us-east-1',
  },
  mailgun: {
    MAILGUN_API_KEY: '<mailgun-api-key>',
    MAILGUN_DOMAIN: '<your-domain>',
  },
  sparkpost: {
    SPARKPOST_API_KEY: '<sparkpost-api-key>',
  },
}

/**
 * Prompts user to select one or more mail drivers they are planning
 * to use.
 */
function getMailDrivers(command: Configure) {
  return command.prompt.multiple(
    'Select the mail drivers you are planning to use',
    DRIVER_PROMPTS,
    {
      name: 'askDrivers',
      validate(choices) {
        return choices && choices.length
          ? true
          : 'Select at least one mail driver. You can always change it later'
      },
    },
  )
}

/**
 * Returns the environment variables for the select drivers
 */
function getEnvValues(drivers: (keyof typeof DRIVER_ENV_VALUES)[]) {
  return drivers.reduce((values, driver) => {
    Object.assign(values, DRIVER_ENV_VALUES[driver])
    return values
  }, {})
}

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  /**
   * Get mail drivers
   */
  const mailDrivers = await getMailDrivers(command)

  /**
   * Create the mail config file
   */
  await command.publishStub('config/mail.stub', {
    primaryDriver: mailDrivers[0],
    smtp: mailDrivers.includes('smtp'),
    ses: mailDrivers.includes('ses'),
    mailgun: mailDrivers.includes('mailgun'),
    sparkpost: mailDrivers.includes('sparkpost'),
  })

  /**
   * Create the mail types file
   */
  await command.publishStub('types/mail.stub')

  /**
   * Add environment variables to the `.env` file
   */
  const envValues = getEnvValues(mailDrivers)
  await command.defineEnvVariables(envValues)

  /**
   * Add the provider to the RC file
   */
  await command.updateRcFile((rcFile) => {
    rcFile
      .addProvider('@adonisjs/mail/providers/mail_provider')
      .addCommand('@adonisjs/mail/commands')
  })

  /**
   * Show packages to install
   */
  if (mailDrivers.includes('ses')) {
    command.listPackagesToInstall([{ name: '@aws-sdk/client-ses', isDevDependency: false }])
  }
}
