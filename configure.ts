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
  { name: 'brevo' as const, message: 'Brevo' },
  { name: 'resend' as const, message: 'Resend' },
]

/**
 * Environment variables for available drivers
 */
const DRIVER_ENV_VALUES = {
  smtp: {
    SMTP_HOST: { value: 'localhost', validation: 'Env.schema.string()' },
    SMTP_PORT: { value: '587', validation: 'Env.schema.number()' },
    SMTP_USERNAME: { value: '<username>', validation: 'Env.schema.string()' },
    SMTP_PASSWORD: { value: '<password>', validation: 'Env.schema.string()' },
  },
  ses: {
    SES_ACCESS_KEY: { value: '<aws-access-key>', validation: 'Env.schema.string()' },
    SES_ACCESS_SECRET: { value: '<aws-access-secret>', validation: 'Env.schema.string()' },
    SES_REGION: { value: '<aws-region>', validation: 'Env.schema.string()' },
  },
  mailgun: {
    MAILGUN_API_KEY: { value: '<mailgun-api-key>', validation: 'Env.schema.string()' },
    MAILGUN_DOMAIN: { value: '<mailgun-domain>', validation: 'Env.schema.string()' },
  },
  sparkpost: {
    SPARKPOST_API_KEY: { value: '<sparkpost-api-key>', validation: 'Env.schema.string()' },
  },
  brevo: {
    BREVO_API_KEY: { value: '<brevo-api-key>', validation: 'Env.schema.string()' },
  },
  resend: {
    RESEND_API_KEY: { value: '<resend-api-key>', validation: 'Env.schema.string()' },
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
    }
  )
}

/**
 * Returns the environment variables for the select drivers
 */
function getEnvValues(drivers: (keyof typeof DRIVER_ENV_VALUES)[]) {
  const validations: any = {}
  const variables: any = {}

  for (const driver of drivers) {
    Object.entries(DRIVER_ENV_VALUES[driver]).forEach(([key, props]) => {
      validations[key] = props.validation
      variables[key] = props.value
    })
  }

  return { validations, variables }
}

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

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
    brevo: mailDrivers.includes('brevo'),
    resend: mailDrivers.includes('resend'),
  })

  /**
   * Add environment variables to the `.env` file
   */
  const { variables, validations } = getEnvValues(mailDrivers)
  await codemods.defineEnvVariables(variables)
  await codemods.defineEnvValidations({
    variables: validations,
    leadingComment: 'Variables for @adonisjs/mail',
  })

  /**
   * Add the provider to the RC file
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addCommand('@adonisjs/mail/commands')
    rcFile.addProvider('@adonisjs/mail/mail_provider')
  })

  /**
   * Show packages to install
   */
  if (mailDrivers.includes('ses')) {
    command.listPackagesToInstall([{ name: '@aws-sdk/client-ses', isDevDependency: false }])
  }
}
