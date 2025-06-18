const express = require("express");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const upload = require("../middleware/upload");
const { customerAuth, employeeAuth } = require("../middleware/auth");

const router = express.Router();

// Generate unique review ID
const generateReviewId = () => {
  return "REV" + Date.now() + Math.floor(Math.random() * 1000);
};

// Create review (customer only)
router.post("/", customerAuth, upload.array("images", 3),async (req, res) => {
  try {
    const { tourId, rating, comment, reviewerName, reviewerPhone } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : []
    // Check if user has completed booking for this tour
    const completedBooking = await Booking.findOne({
      customerId: req.user._id,
      tourId,
      status: "paid",
    });

    if (!completedBooking) {
      return res.status(400).json({ message: "Bạn chỉ có thể đánh giá những tour đã hoàn thành" });
    }

    // Check if user already reviewed this tour
    const existingReview = await Review.findOne({
      customerId: req.user._id,
      tourId,
    });

    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá tour này rồi" });
    }

    const review = new Review({
      reviewId: generateReviewId(),
      customerId: req.user._id,
      tourId,
      rating,
      comment,
      images: images,
      reviewerName,
      reviewerPhone,
    });

    await review.save();
    await review.populate(["customerId", "tourId"]);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get reviews for a tour (public)
router.get("/tour/:tourId", async (req, res) => {
  try {
    const reviews = await Review.find({
      tourId: req.params.tourId,
      status: "approved",
    })
      .populate("customerId", "fullName")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Check if customer can review this tour (customer only)
router.get("/can-review/:tourId", customerAuth, async (req, res) => {
  try {
    const { tourId } = req.params;

    const completedBooking = await Booking.findOne({
      customerId: req.user._id,
      tourId,
      status: "paid",
    });

    const existingReview = await Review.findOne({
      customerId: req.user._id,
      tourId,
    });

    res.json({
      canReview: !!completedBooking && !existingReview,
      hasBooking: !!completedBooking,
      hasReviewed: !!existingReview,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all reviews (employee only)
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate(["customerId", "tourId"])
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update review status (employee only)
router.put("/:id/status", employeeAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate([
      "customerId",
      "tourId",
    ]);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
