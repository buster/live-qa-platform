import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface for Vote document
 */
export interface IVote extends Document {
  questionId: mongoose.Types.ObjectId | string;
  voterName: string;
  type: 'up' | 'down';
  createdAt: Date;
  // Add explicit id property
  id: string;
}

/**
 * Schema for Vote
 */
const VoteSchema: Schema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    voterName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['up', 'down'],
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create a compound index to prevent duplicate votes from the same user on the same question
VoteSchema.index({ questionId: 1, voterName: 1 }, { unique: true });

/**
 * Vote model
 */
export default mongoose.model<IVote>('Vote', VoteSchema);