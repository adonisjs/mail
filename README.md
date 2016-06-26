# Adonis Mail

[![Gitter](https://img.shields.io/badge/+%20GITTER-JOIN%20CHAT%20%E2%86%92-1DCE73.svg?style=flat-square)](https://gitter.im/adonisjs/adonis-framework)
[![Trello](https://img.shields.io/badge/TRELLO-%E2%86%92-89609E.svg?style=flat-square)](https://trello.com/b/yzpqCgdl/adonis-for-humans)
[![Version](https://img.shields.io/npm/v/adonis-mail-provider.svg?style=flat-square)](https://www.npmjs.com/package/adonis-mail-provider)
[![Build Status](https://img.shields.io/travis/adonisjs/adonis-mail/master.svg?style=flat-square)](https://travis-ci.org/adonisjs/adonis-mail)
[![Coverage Status](https://img.shields.io/coveralls/adonisjs/adonis-mail/master.svg?style=flat-square)](https://coveralls.io/github/adonisjs/adonis-mail?branch=master)
[![Downloads](https://img.shields.io/npm/dt/adonis-mail-provider.svg?style=flat-square)](https://www.npmjs.com/package/adonis-mail-provider)
[![License](https://img.shields.io/npm/l/adonis-mail-provider.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> :pray: This repository contains email sending facilities for adonis framework.

Mail provider has support for several drivers to send email from your adonis app.

1. SMTP
2. Amazon SES
3. Mandrill
4. Log ( for testing emails )

## Table of Contents

* [Team Members](#team-members)
* [Getting Started](#getting-started)
* [Contribution Guidelines](#contribution-guidelines)

## <a name="team-members"></a>Team Members

* Harminder Virk ([Caffiene Blogging](http://amanvirk.me/)) <virk.officials@gmail.com>

## <a name="getting-started"></a>Getting Started

```bash
$ npm i --save adonis-mail-provider
```

next register the provider in your `bootstrap/app.js` file.

```bash
const providers = [
  'adonis-mail-provider/providers/MailProvider'
]

const aliases = {
  Mail: 'Adonis/Addons/Mail'
}
```

Example configuration file can be downloaded from [examples/mail.js](examples/mail.js), and should be kept inside `config/mail.js`.

[Official Documentation](http://adonisjs.com/docs/mail)

## <a name="contribution-guidelines"></a>Contribution Guidelines

In favor of active development we accept contributions for everyone. You can contribute by submitting a bug, creating pull requests or even improving documentation.

You can find a complete guide to be followed strictly before submitting your pull requests in the [Official Documentation](http://adonisjs.com/docs/2.0/contributing).
