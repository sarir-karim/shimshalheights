import mongoose from "mongoose";

/** Embedded image reference: Cloudinary delivery URL plus the public id needed to replace/delete it. */
export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, default: "", maxlength: 200 },
  },
  { _id: false },
);
