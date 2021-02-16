declare module '@ioc:Adonis/Addons/Mail' {
  interface MailersList {
    promotional: MailDrivers['smtp']
    transactional: MailDrivers['ses']
    receipts: MailDrivers['mailgun']
  }
}
