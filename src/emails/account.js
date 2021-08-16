const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_kEY)

const sendWelcomeEmail = (email, name)=>{
    sgMail.send({
        to : email,
        from : 'sainathreddykv11@gmail.com',
        subject : 'Thanks for Signing Up',
        text : `Welcome to Sai app, ${name}. This is the Welcoming mail.`
    })
}

const cancellationMail=(email, name)=>{
    sgMail.send({
        to : email,
        from : 'sainathreddykv11@gmail.com',
        subject:'Sorry for your Inconvenience',
        text :`Your account is removed, ${name}. Why do you remove your account.`
    })
}

module.exports={
    sendWelcomeEmail : sendWelcomeEmail,
    cancellationMail : cancellationMail
}