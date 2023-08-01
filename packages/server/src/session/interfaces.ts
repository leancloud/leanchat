declare module 'express-session' {
  interface SessionData {
    uid: string;
  }
}

export interface ICreateSession {
  username: string;
  password: string;
}
