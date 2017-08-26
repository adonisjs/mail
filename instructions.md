## Registering provider

The provider is registered inside `start/app.js` file under `providers` array.

```js
const providers = [
  '@adonisjs/mail/providers/MailProvider'
]
```

That's all! Now you can use the mail provider as follows.

```js
const Mail = use('Mail')

await Mail.send('emails.welcome', {}, (message) => {
  message.from('foo@bar.com')
  message.to('bar@baz.com')
})
```

The `welcome` is the view name stored inside the `resources/views/emails` directory.

## Configuration and Environment variables

The configuration file is saved as `config/mail.js`, feel free to tweak it according.

Also make sure to define sensitive driver details inside the `.env` file and reference them via `Env` provider.
