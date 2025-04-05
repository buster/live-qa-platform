import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface for Session document
 */
export interface ISession extends Document {
  url: string;
  createdAt: Date;
  active: boolean;
  presenterToken: string;
  // Add explicit id property
  id: string;
}

/**
 * Schema for Session
 */
const SessionSchema: Schema = new Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    presenterToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

/**
 * Session model
 */
export default mongoose.model<ISession>('Session', SessionSchema);