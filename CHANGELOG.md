<a name="3.0.9"></a>
## [3.0.9](https://github.com/adonisjs/adonis-mail/compare/v3.0.8...v3.0.9) (2018-10-01)



<a name="3.0.8"></a>
## [3.0.8](https://github.com/adonisjs/adonis-mail/compare/v3.0.7...v3.0.8) (2018-07-20)



<a name="3.0.7"></a>
## [3.0.7](https://github.com/adonisjs/adonis-mail/compare/v3.0.6...v3.0.7) (2018-07-16)


### Features

* **ethereal:** add ethereal driver for test emails ([d84b417](https://github.com/adonisjs/adonis-mail/commit/d84b417)), closes [#22](https://github.com/adonisjs/adonis-mail/issues/22)



<a name="3.0.6"></a>
## [3.0.6](https://github.com/adonisjs/adonis-mail/compare/v3.0.5...v3.0.6) (2018-05-08)



<a name="3.0.5"></a>
## [3.0.5](https://github.com/adonisjs/adonis-mail/compare/v3.0.4...v3.0.5) (2018-01-31)


### Features

* **mail:** detect raw body type when using mail.raw ([79fd24d](https://github.com/adonisjs/adonis-mail/commit/79fd24d)), closes [#21](https://github.com/adonisjs/adonis-mail/issues/21)



<a name="3.0.4"></a>
## [3.0.4](https://github.com/adonisjs/adonis-mail/compare/v3.0.3...v3.0.4) (2018-01-24)


### Bug Fixes

* **mailgun:** fix wrong driver name ([b954e41](https://github.com/adonisjs/adonis-mail/commit/b954e41))



<a name="3.0.3"></a>
## [3.0.3](https://github.com/adonisjs/adonis-mail/compare/v3.0.2...v3.0.3) (2017-10-03)


### Bug Fixes

* **mail:** use in-memory mail fake ([4665cbe](https://github.com/adonisjs/adonis-mail/commit/4665cbe))



<a name="3.0.2"></a>
## [3.0.2](https://github.com/adonisjs/adonis-mail/compare/v3.0.1...v3.0.2) (2017-09-06)


### Features

* **mail:** add memory driver and mail fakes ([bdc67a6](https://github.com/adonisjs/adonis-mail/commit/bdc67a6))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/adonisjs/adonis-mail/compare/v3.0.0...v3.0.1) (2017-08-26)


### Features

* **mail:** proxy mailsender methods ([01c19c9](https://github.com/adonisjs/adonis-mail/commit/01c19c9))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/adonisjs/adonis-mail/compare/v2.0.2...v3.0.0) (2017-08-26)


### Bug Fixes

* **sender:** pass view instance to mail sender ([94b20f2](https://github.com/adonisjs/adonis-mail/commit/94b20f2))


### Features

* fresh new start ([1d57bb6](https://github.com/adonisjs/adonis-mail/commit/1d57bb6))
* rewrite for 4.0 ([62cecfa](https://github.com/adonisjs/adonis-mail/commit/62cecfa))
* **driver:** add mailgun driver ([99ff8ff](https://github.com/adonisjs/adonis-mail/commit/99ff8ff))
* **driver:** add Ses driver ([7d13d9e](https://github.com/adonisjs/adonis-mail/commit/7d13d9e))
* **driver:** add sparkpost driver ([76944b5](https://github.com/adonisjs/adonis-mail/commit/76944b5))
* **driver:** sparkpost now accepts extras for mail ([604650a](https://github.com/adonisjs/adonis-mail/commit/604650a))
* **driver:** write smtp driver ([e3d2832](https://github.com/adonisjs/adonis-mail/commit/e3d2832))
* **drivers:** drivers receives the config via `setConfig` method ([45911a3](https://github.com/adonisjs/adonis-mail/commit/45911a3))
* **instructions:** add instructions for `adonis install` ([83cc8d0](https://github.com/adonisjs/adonis-mail/commit/83cc8d0))
* **message:** allow sending driver extras ([91430c9](https://github.com/adonisjs/adonis-mail/commit/91430c9))
* **providers:** add providers ([3e43cde](https://github.com/adonisjs/adonis-mail/commit/3e43cde))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/adonisjs/adonis-mail/compare/v2.0.1...v2.0.2) (2016-10-11)


### Bug Fixes

* **drivers:** rename Drivers dir to MailDrivers ([fd5d995](https://github.com/adonisjs/adonis-mail/commit/fd5d995)), closes [#5](https://github.com/adonisjs/adonis-mail/issues/5)



<a name="2.0.1"></a>
## [2.0.1](https://github.com/adonisjs/adonis-mail/compare/v1.0.1...v2.0.1) (2016-09-26)


### Bug Fixes

* **driver:** Expose mailgun driver ([ed29f54](https://github.com/adonisjs/adonis-mail/commit/ed29f54))
* **mailgun:** add got as a dependency since some drivers are dependent on it ([2185c5c](https://github.com/adonisjs/adonis-mail/commit/2185c5c)), closes [#4](https://github.com/adonisjs/adonis-mail/issues/4)


### Features

* **mail:mailgun:** add mailgun driver ([3979774](https://github.com/adonisjs/adonis-mail/commit/3979774))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/adonisjs/adonis-mail/compare/v1.0.1...v2.0.0) (2016-06-26)


### Features

* **mail:mailgun:** add mailgun driver([3979774](https://github.com/adonisjs/adonis-mail/commit/3979774))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/adonisjs/adonis-mail/compare/v1.0.0...v1.0.1) (2016-02-13)


### Features

* **mail:** rename new to driver ([99beca3](https://github.com/adonisjs/adonis-mail/commit/99beca3))



<a name="1.0.0"></a>
# 1.0.0 (2016-02-13)


### Bug Fixes

* **mail-manager:** update view method ([4adaef7](https://github.com/adonisjs/adonis-mail/commit/4adaef7))

### Features

* initial commit ([5907616](https://github.com/adonisjs/adonis-mail/commit/5907616))
* **baseDriver:** add baseDriver to ioc container ([6043b1d](https://github.com/adonisjs/adonis-mail/commit/6043b1d))
* **baseDriver:** implement BaseDriver to be extended by other drivers ([0ed0f21](https://github.com/adonisjs/adonis-mail/commit/0ed0f21))
* **log-driver:** add log driver for testing emails ([c110987](https://github.com/adonisjs/adonis-mail/commit/c110987))
* **mail:** did initial setup for sending emails ([1960720](https://github.com/adonisjs/adonis-mail/commit/1960720))
* **mail:** set multiple views in send method ([8efa3ae](https://github.com/adonisjs/adonis-mail/commit/8efa3ae))
* **mail-manager:** add getTransport method ([c915a26](https://github.com/adonisjs/adonis-mail/commit/c915a26))
* **mandrill:** added mandrill driver ([e4b24da](https://github.com/adonisjs/adonis-mail/commit/e4b24da))
* **mandrill:** implement runtime config ([671821d](https://github.com/adonisjs/adonis-mail/commit/671821d))
* **ses:** implemented ses driver ([15d00dd](https://github.com/adonisjs/adonis-mail/commit/15d00dd))



