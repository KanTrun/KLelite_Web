import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  keywords: string[];
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

const FAQSchema: Schema = new Schema({
  question: { type: String, required: true },
  keywords: [String],
  answer: { type: String, required: true },
  category: { type: String, default: 'General' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

FAQSchema.index({ keywords: 1 });
FAQSchema.index({ question: 'text' });

export default mongoose.model<IFAQ>('FAQ', FAQSchema);
