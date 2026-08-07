declare module 'svg-captcha' {
  interface CaptchaOptions {
    size?: number
    noise?: number
    color?: boolean
    background?: string
    width?: number
    height?: number
    fontSize?: number
    charPreset?: string
  }

  interface CaptchaResult {
    data: string
    text: string
  }

  const svgCaptcha: {
    create(options?: CaptchaOptions): CaptchaResult
    createMathExpr(options?: CaptchaOptions): CaptchaResult
  }

  export default svgCaptcha
}
