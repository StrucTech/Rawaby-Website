import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface for User document
export interface IUser extends Document {
  name: string;
  country: string;
  phone: string;
  nationalId: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  active: boolean;
  emailVerificationToken: string;
  emailVerified: boolean;
  userId: number;
}

// Interface for User model
interface IUserModel extends Model<IUser> {
  // Add any static methods here if needed
}

// User schema
const userSchema = new mongoose.Schema<IUser, IUserModel>({
  name: {
    type: String,
    required: [true, 'الرجاء إدخال الاسم'],
    trim: true
  },
  country: {
    type: String,
    default: 'السعودية'
  },
  phone: {
    type: String,
    required: [true, 'الرجاء إدخال رقم الجوال'],
    unique: true,
    trim: true
  },
  nationalId: {
    type: String,
    required: [true, 'الرجاء إدخال رقم الهوية'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'الرجاء إدخال البريد الإلكتروني'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'الرجاء إدخال كلمة المرور'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'supervisor', 'delegate'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    unique: true,
    index: true,
  }
}, {
  timestamps: true
});

// Hash password and generate userId before saving
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    let start = 1;
    let roleFilter = {};
    if (this.role === 'supervisor') {
      start = 1000;
      roleFilter = { role: 'supervisor', userId: { $gte: 1000 } };
    } else if (this.role === 'delegate') {
      start = 2000;
      roleFilter = { role: 'delegate', userId: { $gte: 2000 } };
    }
    if (this.role === 'supervisor' || this.role === 'delegate') {
      const last = await mongoose.models.User.findOne(roleFilter, {}, { sort: { userId: -1 } });
      this.userId = last && last.userId ? last.userId + 1 : start;
    } else {
      const last = await mongoose.models.User.findOne({}, {}, { sort: { userId: -1 } });
      this.userId = last && last.userId ? last.userId + 1 : start;
    }
  }
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Export the model
export const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', userSchema); 