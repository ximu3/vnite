export interface AccountAPI {
  authSignin(): Promise<boolean>
  authSignup(): Promise<boolean>
}
