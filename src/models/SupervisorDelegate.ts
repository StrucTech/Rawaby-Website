import mongoose, { Document, Model } from 'mongoose';

export interface ISupervisorDelegate extends Document {
  supervisorId: mongoose.Types.ObjectId;
  delegateId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supervisorDelegateSchema = new mongoose.Schema<ISupervisorDelegate>({
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  delegateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export const SupervisorDelegate = (mongoose.models.SupervisorDelegate as Model<ISupervisorDelegate>) || mongoose.model<ISupervisorDelegate>('SupervisorDelegate', supervisorDelegateSchema); 