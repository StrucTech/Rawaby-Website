// User interface for type checking
export interface IUser {
  id?: string;
  name: string;
  country: string;
  phone: string;
  nationalId: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'supervisor' | 'delegate';
  createdAt?: Date;
  updatedAt?: Date;
  active: boolean;
  emailVerificationToken?: string;
  emailVerified: boolean;
  userId?: number;
}
