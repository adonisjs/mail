/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@adonisjs/core/helpers/string'
import type Configure from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.js'

/**
 * List of env variables used by different transports
 */
const ENV_VARIABLES: Record<string, Record<string, string | number>> = {
  smtp: { SMTP_HOST: 'localhost', SMTP_PORT: 1025 },
  ses: {
    AWS_ACCESS_KEY_ID: 'your-access-key-id',
    AWS_SECRET_ACCESS_KEY: 'your-secret-key',
    AWS_REGION: 'us-east-1',
  },
  mailgun: { MAILGUN_API_KEY: 'your-mailgun-api-key', MAILGUN_DOMAIN: 'mg.example.com' },
  sparkpost: { SPARKPOST_API_KEY: 'your-sparkpost-api-key' },
  resend: { RESEND_API_KEY: 'your-resend-api-key' },
  brevo: { BREVO_API_KEY: 'your-brevo-api-key' },
}

/**
 * List of supported transports
 */
const KNOWN_TRANSPORTS = Object.keys(ENV_VARIABLES)

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  /**
   * Read transports from the "--transports" CLI flag
   */
  let selectedTransports: string | string[] | undefined = command.parsedFlags.transports

  /**
   * Display prompts when transports have been selected
   * via the CLI flag
   */
  if (!selectedTransports) {
    selectedTransports = await command.prompt.multiple(
      'Select the mail services you want to use',
      KNOWN_TRANSPORTS,
      {
        validate(values) {
          return !values || !values.length ? 'Please select one or more transports' : true
        },
      }
    )
  }

  /**
   * Normalized list of transports
   */
  const transports =
    typeof selectedTransports === 'string' ? [selectedTransports] : selectedTransports!

  const unknownTransport = transports.find((transport) => !KNOWN_TRANSPORTS.includes(transport))
  if (unknownTransport) {
    command.exitCode = 1
    command.logger.logError(
      `Invalid transport "${unknownTransport}". Supported transports are: ${string.sentence(
        KNOWN_TRANSPORTS
      )}`
    )
    return
  }

  const codemods = await command.createCodemods()

  /**
   * Publish config file
   */
  await codemods.makeUsingStub(stubsRoot, 'config/mail.stub', {
    transports: transports,
  })

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
    transports.reduce<Record<string, string>>(
      (result, transport) => {
        Object.assign(result, ENV_VARIABLES[transport])
        return result
      },
      {
        MAIL_MAILER: transports[0],
        MAIL_FROM_NAME: 'Your name',
        MAIL_FROM_ADDRESS: 'app@yourdomain.com',
      }
    )
  )

  /**
   * Define env variables validation for the selected transports
   */
  await codemods.defineEnvValidations({
    leadingComment: 'Variables for configuring the mail package',
    variables: transports.reduce<Record<string, string>>(
      (result, transport) => {
        for (const envVariable of Object.keys(ENV_VARIABLES[transport])) {
          result[envVariable] =
            `Env.schema.${envVariable === 'SMTP_PORT' ? 'number()' : 'string()'}`
        }
        return result
      },
      {
        MAIL_MAILER: `Env.schema.enum(['${transports.join("','")}'] as const)`,
        MAIL_FROM_NAME: 'Env.schema.string()',
        MAIL_FROM_ADDRESS: 'Env.schema.string()',
      }
    ),
  })
}
