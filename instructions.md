## Register provider

Make sure to register the provider inside `start/app.js` file.

```js
const providers = [
  '@adonisjs/mail/providers/MailProvider'
]
```

That's all 🎉

## Example usage

Generate view `welcome.edge` as 

```bash
adonis make:view welcome
```

Then send message as

```js
const user = {
  name: 'Jon Snow',
  email: 'jsonsnow@example.com'
}

await Mail.send('welcome', {
  user
}, (message) => {
  message.from('noreply@mydomainname.com')
  message.to(user.email, user.name)
  message.subject('Test, Hello world!')
})
```
