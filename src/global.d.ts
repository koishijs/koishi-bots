import 'koishi-core'

declare module 'koishi-core' {
  interface User {
    school: {
      username: string
      password: string
    }
  }
}
