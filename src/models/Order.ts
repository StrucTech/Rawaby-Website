import mongoose, { Document, Model } from 'mongoose';

// Define the Order interface
export interface IOrder extends Document {
  clientId: mongoose.Types.ObjectId; // كان userId
  supervisorId?: mongoose.Types.ObjectId;
  delegateId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  services: mongoose.Types.ObjectId[];
  status: 'new' | 'in_progress' | 'done' | 'pending' | 'paid';
  note?: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Order schema
const orderSchema = new mongoose.Schema<IOrder>({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'الرجاء تحديد العميل']
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  delegateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'الرجاء تحديد الخدمات']
  }],
  status: {
    type: String,
    enum: {
      values: ['new', 'in_progress', 'done', 'pending', 'paid'],
      message: 'حالة الطلب غير صالحة'
    },
    default: 'new'
  },
  note: {
    type: String,
    trim: true
  },
  totalPrice: {
    type: Number,
    required: [true, 'الرجاء تحديد السعر الإجمالي'],
    min: [0, 'يجب أن يكون السعر الإجمالي 0 أو أكثر']
  }
}, {
  timestamps: true
});

// Create and export the model
const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order; 