import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type { AppConfig } from '../../../config/config'
import { CommonConstant } from '../../../common'

export class EmailService {
  private readonly transporter: nodemailer.Transporter | null
  private readonly templateRoot: string

  constructor(config: AppConfig) {
    const templateDir =
      Bun.env.NODE_ENV === 'development' ? 'public/template' : 'template'
    this.templateRoot = join(process.cwd(), templateDir, 'email')
    const email = config.email as SMTPTransport.Options | undefined
    this.transporter = email?.host ? nodemailer.createTransport(email) : null
  }

  public async sendMail(options: {
    to: string
    subject: string
    html?: string
    text?: string
    from?: string
  }) {
    if (!this.transporter) return { success: false, message: '邮件服务未配置' }
    await this.transporter.sendMail(options)
    return { success: true }
  }

  public sendCaptchaMail(
    to: string,
    code: string,
    expiresIn = CommonConstant.EMAIL_CAPTCHA_EXPIRES_IN,
  ) {
    return this.sendMail({
      to,
      subject: '账号安全验证',
      html: this.renderTemplate('captcha', { code, expiresIn }),
    })
  }

  public sendNoticeMail(to: string, title: string, content: string) {
    return this.sendMail({
      to,
      subject: `【系统通知】${title}`,
      html: this.renderTemplate('notice', { title, content }),
    })
  }

  public sendAlertMail(to: string, errorMessage: string) {
    return this.sendMail({
      to,
      subject: '⚠️ 系统异常告警',
      html: this.renderTemplate('alert', { errorMessage }),
    })
  }

  public sendCaptcha(
    to: string,
    code: string,
    expiresIn = CommonConstant.EMAIL_CAPTCHA_EXPIRES_IN,
  ) {
    return this.sendCaptchaMail(to, code, expiresIn)
  }

  public sendSystemNotice(to: string, title: string, content: string) {
    return this.sendNoticeMail(to, title, content)
  }

  public sendAdminAlert(to: string, errorMessage: string) {
    return this.sendAlertMail(to, errorMessage)
  }

  private renderTemplate(
    name: 'captcha' | 'notice' | 'alert',
    context: Record<string, unknown>,
  ) {
    const filePath = join(this.templateRoot, `${name}.hbs`)
    const template = existsSync(filePath)
      ? readFileSync(filePath, 'utf8')
      : this.defaultTemplate(name)
    return template
      .replace(/{{{\s*(\w+)\s*}}}/g, (_, key: string) =>
        String(context[key] ?? ''),
      )
      .replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => escapeHtml(context[key]))
  }

  private defaultTemplate(name: string) {
    if (name === 'captcha')
      return '<p>验证码：{{code}}，{{expiresIn}} 分钟内有效</p>'
    if (name === 'notice') return '<h3>{{title}}</h3><div>{{content}}</div>'
    return '<p>系统异常告警：{{errorMessage}}</p>'
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
