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
      subject: `Bem-vindo(a) ao ${website.siteShortTitle}`,
      text: `Olá ${name}, bem-vindo(a) ao ${website.siteTitle}!`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Bem-vindo</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border: 1px solid #dddddd;
                border-radius: 5px;
                overflow: hidden;
              }
              .header {
                background-color: ${website.emailColor};
                color: #ffffff;
                padding: 20px;
                padding-top: 100px;
                padding-bottom: 100px;
                text-align: center;
                background-image: url("${website.emailCoverUrl}");
                background-size: cover;
                background-blend-mode: overlay;
              }
              .header h1 {
                margin: 0;
              }
              .content {
                padding: 20px;
              }
              .content p {
                line-height: 1.6;
              }
              .button-container {
                text-align: center;
                margin: 20px 0;
              }
              .button {
                background-color: ${website.emailColor};
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
              }
              .footer {
                background-color: #f4f4f4;
                color: #777777;
                padding: 10px;
                text-align: center;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>${website.siteTitle}</h1>
              </div>
              <div class="content">
                <p>Olá ${name},</p>
                <p>
                  Estamos muito felizes em ter você conosco. Esperamos que você aproveite tudo o que temos a oferecer.
                </p>
                <p>Atenciosamente,<br />Equipe ${website.siteTitle}</p>
              </div>
              <div class="footer">
                <p>&copy; Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }
  },
  verificationCode: function (code: string): EmailOptions {
    return {
      subject: `Código de verificação para ${website.siteShortTitle}`,
      text: `Seu código de verificação é: ${code}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Código de Verificação</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border: 1px solid #dddddd;
                border-radius: 5px;
                overflow: hidden;
              }
              .header {
                background-color: #007bff;
                color: #ffffff;
                padding: 20px;
                padding-top: 100px;
                padding-bottom: 100px;
                text-align: center;
                background-image: url("${website.emailCoverUrl}");
                background-size: cover;
                background-blend-mode: overlay;
              }
              .header h1 {
                margin: 0;
              }
              .content {
                padding: 20px;
              }
              .content p {
                line-height: 1.6;
              }
              .button-container {
                text-align: center;
                margin: 20px 0;
              }
              .button {
                background-color: #007bff;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
              }
              .footer {
                background-color: #f4f4f4;
                color: #777777;
                padding: 10px;
                text-align: center;
                font-size: 12px;
              }
              .code {
                text-align: center;
                font-size: 30px;
                padding-bottom: 0px;
              }
              .text-blu {
                color: #007bff;
              }
              .quadrado {
                background-color: #007bff;
                border-radius: 10px;
              }
              .white {
                color: white;
              }
            </style>
          </head>
          <body>
    <div class="email-container">
      <div class="header">
        <h1>${website.siteTitle}</h1>
      </div>
      <div class="content">
        <p class="code">Seu código de verificação é:</p>
        <div class="quadrado">
          <p class="code"><strong class="white">${code}</strong></p>
        </div>
        <p>
          Por favor, insira este código para continuar com seu processo de
          verificação.
        </p>
        <p>Atenciosamente,<br />Equipe ${website.siteTitle}</p>
      </div>
      <div class="footer">
        <p>&copy; Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
        </html>
      `,
    }
  },
  resetPassword: function (reset_link: string): EmailOptions {
    return {
      subject: `Redefinição de senha para ${website.siteShortTitle}`,
      text: `Clique no link para redefinir sua senha: ${reset_link}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Redefinição de Senha</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border: 1px solid #dddddd;
                border-radius: 5px;
                overflow: hidden;
              }
              .header {
                background-color: ${website.emailColor};
                color: #ffffff;
                padding: 20px;
                padding-top: 100px;
                padding-bottom: 100px;
                text-align: center;
                background-image: url("${website.emailCoverUrl}");
                background-size: cover;
                background-blend-mode: overlay;
              }
              .header h1 {
                margin: 0;
              }
              .content {
                padding: 20px;
              }
              .content p {
                line-height: 1.6;
              }
              .button-container {
                text-align: center;
                margin: 20px 0;
              }
              .button {
                background-color: #007bff;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
              }
              .footer {
                background-color: #f4f4f4;
                color: #777777;
                padding: 10px;
                text-align: center;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>${website.siteTitle}</h1>
              </div>
              <div class="content">
                <p>Clique no link abaixo para redefinir sua senha:</p>
                <div class="button-container">
                  <a href="${reset_link}" class="button">Redefinir Senha</a>
                </div>
                <p>Se você não solicitou a redefinição de senha, por favor, ignore este e-mail.</p>
                <p>Atenciosamente,<br />Equipe ${website.siteTitle}</p>
              </div>
              <div class="footer">
                <p>&copy; Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }
  },
  magicLink: function (magic_link: string): EmailOptions {
    return {
      subject: `Login para ${website.siteShortTitle}`,
      text: `Clique no link para fazer login: ${magic_link}`,
      html: `Clique no link para fazer login: <a href="${magic_link}">${magic_link}</a>`,
    }
  },
}
