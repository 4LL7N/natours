const nodemailer = require('nodemailer')
const pug = require('pug')
const {convert} = require('html-to-text')
// new Email(user,url).sendWelcome()

module.exports = class Email {
    // this will run when new object will be created thru this class
    constructor(user,url){
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `nike <${process.env.EMAIL_FROM}> `
    }

    newTransport(){
        if(process.env.NODE_ENV == 'production'){
            //Sendgrid
            return 1
        }
        return nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            secure: false,
            auth:{
                user:process.env.EMAIL_USERNAME,
                pass:process.env.EMAIL_PASSWORD
            }
            //Activate in gmail "less secure app" option
        })
    }

    async send(template, subject){
        // send the actual email

        // 1) render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
            firstName:this.firstName,
            url:this.url,
            subject
        })


        //2) define email options
        const mailOptions = {
            from:this.from,
            to:this.to,
            subject,
            html,
            text:convert(html)
            //old version
            // text:htmlToText(html),
            // html:
        }

        //3) create a transport and send email
        

        this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome(){
        await this.send('welcome','Welcome to the Natours Family ')
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid for only 10 minute)')
    }
}

// const sendEmail =  options => {
    // 1) Create a transporter
    
    // const transporter = nodemailer.createTransport({
    //     host:process.env.EMAIL_HOST,
    //     port:process.env.EMAIL_PORT,
    //     secure: false,
    //     auth:{
    //         user:process.env.EMAIL_USERNAME,
    //         pass:process.env.EMAIL_PASSWORD
    //     }
    //     //Activate in gmail "less secure app" option
    // })
    

    // 2) Define the email options

    // const mailOptions = {
    //     from:'nike <niska@test.test> ',
    //     to:options.email,
    //     subject:options.subject,
    //     text:options.message,
    //     // html:
    // }

    // 3) Actually send the email
    // async function main(){
    //     const info =  await transporter.sendMail(mailOptions)
    //     console.log("Message sent: %s", info.messageId)
    // }
    // main().catch(console.error);
// }

// module.exports = sendEmail