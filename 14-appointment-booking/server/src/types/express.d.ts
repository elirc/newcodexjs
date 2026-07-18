declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      role: "customer" | "provider" | "admin";
    };
  }
}
