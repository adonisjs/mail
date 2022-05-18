The package has been configured successfully. The configuration for Mail relies on certain environment variables and it is usually a good practice to validate the presence of those environment variables.

Open the `env.ts` file and define validate the environment variables based upon the drivers you are using

### Variables for the SMTP driver

```ts
SMTP_HOST: Env.schema.string({ format: 'host' }),
SMTP_PORT: Env.schema.number(),
SMTP_USERNAME: Env.schema.string(),
SMTP_PASSWORD: Env.schema.string(),
```

### Variables for the SES driver

```ts
SES_ACCESS_KEY: Env.schema.string(),
SES_ACCESS_SECRET: Env.schema.string(),
SES_REGION: Env.schema.string(),
```

### Variables for the Mailgun driver

```ts
MAILGUN_API_KEY: Env.schema.string(),
MAILGUN_DOMAIN: Env.schema.string(),
```

### Variables for the Sparkpost driver

```ts
SPARKPOST_API_KEY: Env.schema.string(),
```
