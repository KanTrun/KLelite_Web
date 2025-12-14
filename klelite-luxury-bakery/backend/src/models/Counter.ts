import mongoose, { Schema } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICounter>('Counter', CounterSchema);
