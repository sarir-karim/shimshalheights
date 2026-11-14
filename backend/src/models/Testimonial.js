import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true, maxlength: 1500 },
    guestLocation: { type: String, default: "", trim: true, maxlength: 80 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
