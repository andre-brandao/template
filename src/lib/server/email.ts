import nodemailer from 'nodemailer'

import { env } from '$env/dynamic/private'

import { website } from '$lib/config'

interface EmailOptions {
  subject: string
  text: string
  html: string
}

export async function sendMail(to: string, email: EmailOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.GOOGLE_ACC_EMAIL,
      pass: env.GOOGLE_ACC_PASSWORD,
    },
  })

  const worked = await transporter.sendMail({
    from: {
      name: website.siteShortTitle,
      address: env.GOOGLE_ACC_EMAIL,
    },
    to: to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  })

  return worked.response
}

export const emailTemplate = {
  welcome: function (name: string): EmailOptions {
    return {
      subject: `Welcome to ${website.siteShortTitle}`,
      text: `Hello ${name}, welcome to ${website.siteTitle}!`,
      html: `<p>Hello ${name}, welcome to ${website.siteTitle}!</p>`,
    }
  },
  verificationCode: function (code: string): EmailOptions {
    return {
      subject: `Verification code for ${website.siteShortTitle}`,
      text: `Your verification code is: ${code}`,
      html: `<p>Your verification code is: ${code}</p>`,
    }
  }
}
