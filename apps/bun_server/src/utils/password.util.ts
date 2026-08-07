import argon2 from 'argon2'

export async function encryptPassword(password: string): Promise<string> {
  if (!password) return password
  try {
    await argon2.verify(password, 'dummy')
    return password
  } catch {
    return argon2.hash(password)
  }
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    if (!plainPassword || !hashedPassword) return false
    return await argon2.verify(hashedPassword, plainPassword)
  } catch {
    return false
  }
}
