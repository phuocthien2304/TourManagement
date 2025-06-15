const express = require("express")
const Tour = require("../models/Tour")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Generate unique tour ID
const generateTourId = () => {
  return "TOUR" + Date.now() + Math.floor(Math.random() * 1000)
}

// Get all tours (public)
router.get("/", async (req, res) => {
  try {
    const { destination, startDate, endDate, minPrice, maxPrice, page = 1, limit = 10 } = req.query

    const query = { status: "active" }

    // Add filters
    if (destination) {
      query.destination = { $regex: destination, $options: "i" }
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    const tours = await Tour.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Tour.countDocuments(query)

    res.json({
      tours,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get tour by ID
router.get("/:id", async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }
    res.json(tour)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create tour (Admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const tourData = {
      ...req.body,
      tourId: generateTourId(),
    }

    const tour = new Tour(tourData)
    await tour.save()

    res.status(201).json(tour)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update tour (Admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }

    res.json(tour)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete tour (Admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }
    res.json({ message: "Tour deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
