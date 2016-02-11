var nodemailer = require('nodemailer')

var transport = nodemailer.createTransport({
  host: "mailtrap.io",
  port: 2525,
  auth: {
    user: "22772bd99f2cad444",
    pass: "99949a35f30a04"
  }
});

var mailOptions = {
    to: 'virk@inbox.mailtrap.io', // sender address
    from: 'virk.officials@gmail.com', // list of receivers
    subject: 'Hello', // Subject line
    text: 'Hello world', // plaintext body
    html: '<b>Hello world</b>' // html body
};

// send mail with defined transport object
transport.sendMail(mailOptions, function(error, info){
    if(error){
      console.log(error);
    }
    console.log('Message sent: ' + info.response);
})
