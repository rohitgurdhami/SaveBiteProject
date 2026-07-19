declare module 'express' {
  export interface Request {
    headers: Record<string, string | undefined>;
    body: any;
    query: Record<string, string | string[] | undefined>;
    params: Record<string, string>;
  }

  export interface Response {
    status: (code: number) => Response;
    json: (body: any) => Response;
    send: (body: any) => Response;
  }

  export type NextFunction = () => void;
  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => any;
  export interface Router {
    get: (...args: any[]) => void;
    post: (...args: any[]) => void;
    put: (...args: any[]) => void;
    patch: (...args: any[]) => void;
    delete: (...args: any[]) => void;
    use: (...args: any[]) => void;
  }

  interface ExpressApp {
    use: (...args: any[]) => void;
    get: (...args: any[]) => void;
    listen: (...args: any[]) => void;
  }

  interface ExpressFactory {
    (): ExpressApp;
    Router: () => Router;
    json: (...args: any[]) => any;
    urlencoded: (...args: any[]) => any;
  }

  const express: ExpressFactory;
  export const Router: () => Router;
  export default express;
}

declare module 'cors' {
  const cors: (...args: any[]) => any;
  export default cors;
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string): any;
  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
  };
  export default jwt;
}

declare module 'supertest' {
  const request: any;
  export default request;
}

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => any) => void;
declare const beforeAll: (fn: () => any) => void;
declare const expect: any;
