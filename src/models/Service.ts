import mongoose, { Document, Model } from 'mongoose';

// Interface for Service document
export interface IService extends Document {
  title: string;
  description: string;
  durationDays: number;
  price: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Service model
interface IServiceModel extends Model<IService> {
  // Add any static methods here if needed
}

// Service schema
const serviceSchema = new mongoose.Schema<IService, IServiceModel>({
  title: {
    type: String,
    required: [true, 'الرجاء إدخال عنوان الخدمة'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'الرجاء إدخال وصف الخدمة'],
    trim: true
  },
  durationDays: {
    type: Number,
    required: [true, 'الرجاء إدخال مدة الخدمة بالأيام'],
    min: [1, 'مدة الخدمة يجب أن تكون يوم واحد على الأقل']
  },
  price: {
    type: Number,
    required: [true, 'الرجاء إدخال سعر الخدمة'],
    min: [0, 'سعر الخدمة يجب أن يكون صفر أو أكثر']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Export the model
export const Service = (mongoose.models.Service as IServiceModel) || mongoose.model<IService, IServiceModel>('Service', serviceSchema); 