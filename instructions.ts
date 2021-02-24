/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Prompt choices for the mail driver selection
 */
const DRIVER_PROMPTS = [
  {
    name: 'smtp' as const,
    message: 'SMTP',
  },
  {
    name: 'ses' as const,
    message: 'Amazon SES',
  },
  {
    name: 'mailgun' as const,
    message: 'Mailgun',
  },
  {
    name: 'sparkpost' as const,
    message: 'SparkPost',
  },
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
function getMailDrivers(sink: typeof sinkStatic) {
  return sink
    .getPrompt()
    .multiple('Select the mail drivers you are planning to use', DRIVER_PROMPTS, {
      validate(choices) {
        return choices && choices.length
          ? true
          : 'Select atleast one mail driver. You can always change it later'
      },
    })
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
 * Returns absolute path to the stub relative from the templates
 * directory
 */
function getStub(...relativePaths: string[]) {
  return join(__dirname, 'templates', ...relativePaths)
}

/**
 * Instructions to be executed when setting up the package.
 */
export default async function instructions(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic
) {
  /**
   * Get mail drivers
   */
  const mailDrivers = await getMailDrivers(sink)

  /**
   * Create the mail config file
   */
  const configPath = app.configPath('mail.ts')
  const mailConfig = new sink.files.MustacheFile(projectRoot, configPath, getStub('config.txt'))
  mailConfig.overwrite = true

  mailConfig
    .apply({
      primaryDriver: mailDrivers[0],
      smtp: mailDrivers.includes('smtp'),
      ses: mailDrivers.includes('ses'),
      mailgun: mailDrivers.includes('mailgun'),
      sparkpost: mailDrivers.includes('sparkpost'),
    })
    .commit()
  const configDir = app.directoriesMap.get('config') || 'config'
  sink.logger.action('create').succeeded(`${configDir}/mail.ts`)

  /**
   * Create the mail contracts file
   */
  const contractsPath = app.makePath('contracts/mail.ts')
  const mailContract = new sink.files.MustacheFile(
    projectRoot,
    contractsPath,
    getStub('contract.txt')
  )
  mailContract.overwrite = true
  mailContract
    .apply({
      smtp: mailDrivers.includes('smtp'),
      ses: mailDrivers.includes('ses'),
      mailgun: mailDrivers.includes('mailgun'),
      sparkpost: mailDrivers.includes('sparkpost'),
    })
    .commit()
  sink.logger.action('create').succeeded('contracts/mail.ts')

  /**
   * Setup .env file
   */
  const env = new sink.files.EnvFile(projectRoot)

  /**
   * Unset all existing env values as should keep the .env file clean
   */
  Object.keys(getEnvValues(['mailgun', 'ses', 'smtp', 'sparkpost'])).forEach((key) => {
    env.unset(key)
  })

  /**
   * Then define the env values for the selected drivers
   */
  const envValues = getEnvValues(mailDrivers)
  Object.keys(envValues).forEach((key) => {
    env.set(key, envValues[key])
  })
  env.commit()
  sink.logger.action('update').succeeded('.env,.env.example')

  /**
   * Install required dependencies
   */
  if (mailDrivers.includes('ses')) {
    const pkg = new sink.files.PackageJsonFile(projectRoot)
    pkg.install('aws-sdk', undefined, false)

    const spinner = sink.logger.await(
      `Installing packages: ${pkg.getInstalls(false).list.join(', ')}`
    )

    try {
      await pkg.commitAsync()
      spinner.update('Packages installed')
    } catch (error) {
      spinner.update('Unable to install packages')
      sink.logger.fatal(error)
    }

    spinner.stop()
  }
}
