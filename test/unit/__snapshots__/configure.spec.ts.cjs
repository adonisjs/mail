exports[`Configure > publish config file based on driver selection 1`] = `"import env from '#start/env'
import { defineConfig, mailers } from \\"@adonisjs/mail\\";

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default mailer
  |--------------------------------------------------------------------------
  |
  | The following mailer will be used to send emails, when you don't specify
  | a mailer
  |
  */
  default: 'smtp',

  /*
  |--------------------------------------------------------------------------
  | Mailers
  |--------------------------------------------------------------------------
  |
  | You can define or more mailers to send emails from your application. A
  | single 'driver' can be used to define multiple mailers with different
  | config.
  |
  | For example: Postmark driver can be used to have different mailers for
  | sending transactional and promotional emails
  |
  */
  mailers: {
		
    /*
    |--------------------------------------------------------------------------
    | Smtp
    |--------------------------------------------------------------------------
    |
    | Uses SMTP protocol for sending email
    |
    */
    smtp: mailers.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
			auth: {
				user: env.get('SMTP_USERNAME'),
				pass: env.get('SMTP_PASSWORD'),
				type: 'login',
			}
    }),
		
		
    /*
    |--------------------------------------------------------------------------
    | SES
    |--------------------------------------------------------------------------
    |
    | Uses Amazon SES for sending emails. You will have to install the
    | @aws-sdk/client-ses when using this driver.
    |
    | npm i @aws-sdk/client-ses
    |
    */
    ses: mailers.ses({
      apiVersion: '2010-12-01',
      key: env.get('SES_ACCESS_KEY'),
      secret: env.get('SES_ACCESS_SECRET'),
      region: env.get('SES_REGION'),
      sslEnabled: true,
      sendingRate: 10,
      maxConnections: 5,
    }),
		
		
		
    
    
  },
})"`

exports[`Configure > add MailProvider to the rc file 1`] = `"export default defineConfig({
  commands: [() => import('@adonisjs/mail/commands')],
  providers: [() => import('@adonisjs/mail/mail_provider')]
})
"`

