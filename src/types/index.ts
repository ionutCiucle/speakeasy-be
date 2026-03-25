export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  password: string;
}
