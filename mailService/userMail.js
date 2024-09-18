const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'harshit995905@gmail.com',
        pass: 'syyk rung ljrm arce',
    },
});

module.exports = transporter