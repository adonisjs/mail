/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import type Configure from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.js'

/**
 * List of env variables used by different transports
 */
const ENV_VARIABLES = {
  smtp: ['SMTP_HOST', 'SMTP_PORT'],
  ses: ['SES_ACCESS_KEY_ID', 'SES_SECRET_ACCESS_KEY', 'SES_REGION'],
  mailgun: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
  sparkpost: ['SPARKPOST_API_KEY'],
  resend: ['RESEND_API_KEY'],
  brevo: ['BREVO_API_KEY'],
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
    transports.reduce<Record<string, string>>((result, transport) => {
      ENV_VARIABLES[transport as keyof typeof ENV_VARIABLES].forEach((envVariable) => {
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
      ENV_VARIABLES[transport as keyof typeof ENV_VARIABLES].forEach((envVariable) => {
        result[envVariable] = 'Env.schema.string()'
      })
      return result
    }, {}),
  })
}
