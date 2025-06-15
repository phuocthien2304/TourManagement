const mongoose = require("mongoose")

const tourSchema = new mongoose.Schema(
  {
    tourId: {
      type: String,
      required: true,
      unique: true,
    },
    tourName: {
      type: String,
      required: true,
    },
    departure: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    itinerary: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    transportation: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availableSlots: {
      type: Number,
      required: true,
    },
    services: [
      {
        type: String,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Tour", tourSchema)
