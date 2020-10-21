The package has been configured successfully. The mail configuration stored inside `config/mail.ts` file relies on the following environment variables and hence we recommend validating them.

Open the `env.ts` file and paste the following code inside the `Env.rules` object.

## Variables for the SMTP driver

```ts
SMTP_HOST: Env.schema.string({ format: 'host' }),
SMTP_PORT: Env.schema.number(),
SMTP_USERNAME: Env.schema.string(),
SMTP_PASSWORD: Env.schema.string(),
```

- The `SMTP_HOST` should always be present and formatted as a valid `host`.
- The `SMTP_PORT` should always be present and a valid number.
- The `SMTP_USERNAME` and `SMTP_PASSWORD` are required to authenticate with the SMTP server. If you are not using authentication, then remove these environment variables and update the `config/mail.ts` file to not reference them.

## Variables for the SES driver
The SES driver needs to authenticate with the Amazon web services. You can begin by creating an IAM role with the ability to send emails using SES and copy/paste the `secret key` and the `access key` inside the `.env` file.

```ts
SES_ACCESS_KEY: Env.schema.string(),
SES_ACCESS_SECRET: Env.schema.string(),
SES_REGION: Env.schema.string(),
```

## Variables for the Mailgun driver
You just need the Mailgun's private key in order to send emails using the Mailgun driver.

```ts
MAILGUN_API_KEY: Env.schema.string(),
```

## Variables for the Sparkpost driver
You just need the Sparkpost's API key in order to send emails using the Sparkpost driver.

```ts
SPARKPOST_API_KEY: Env.schema.string(),
```

