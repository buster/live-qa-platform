import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface for Media
 */
export interface IMedia {
  type: 'image' | 'link';
  url: string;
  thumbnail?: string;
}

/**
 * Interface for Votes
 */
export interface IVotes {
  up: number;
  down: number;
}

/**
 * Interface for Question document
 */
export interface IQuestion extends Document {
  sessionId: mongoose.Types.ObjectId | string;
  text: string;
  authorName: string;
  isAnswered: boolean;
  votes: IVotes;
  media?: IMedia[];
  createdAt: Date;
  updatedAt: Date;
  // Add explicit id property
  id: string;
}

/**
 * Schema for Question
 */
const QuestionSchema: Schema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500, // Maximum length as per specification
    },
    authorName: {
      type: String,
      required: true,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    votes: {
      up: {
        type: Number,
        default: 0,
      },
      down: {
        type: Number,
        default: 0,
      },
    },
    media: [
      {
        type: {
          type: String,
          enum: ['image', 'link'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

/**
 * Question model
 */
export default mongoose.model<IQuestion>('Question', QuestionSchema);