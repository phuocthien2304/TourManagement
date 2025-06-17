const express = require("express")
const Booking = require("../models/Booking")
const Tour = require("../models/Tour")
const { auth, customerAuth, employeeAuth } = require("../middleware/auth")  // Sửa chỗ này

const router = express.Router()

// Generate unique booking ID
const generateBookingId = () => {
  return "BOOK" + Date.now() + Math.floor(Math.random() * 1000)
}

// Create booking (chỉ customer được phép tạo booking)
router.post("/", customerAuth, async (req, res) => {
  try {
    const { tourId, numberOfPeople, notes } = req.body

    // Check if tour exists and has available slots
    const tour = await Tour.findById(tourId)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }

    if (tour.availableSlots < numberOfPeople) {
      return res.status(400).json({ message: "Not enough available slots" })
    }

    // Calculate total amount
    const totalAmount = tour.price * numberOfPeople

    // Create booking
    const booking = new Booking({
      bookingId: generateBookingId(),
      customerId: req.user._id,
      tourId,
      numberOfPeople,
      totalAmount,
      notes,
    })

    await booking.save()

    // Update tour available slots
    tour.availableSlots -= numberOfPeople
    await tour.save()

    // Populate booking data
    await booking.populate(["customerId", "tourId"])

    res.status(201).json(booking)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user bookings (chỉ customer mới xem được lịch sử đặt của mình)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id }).populate("tourId").sort({ createdAt: -1 })

    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all bookings (chỉ employee/admin mới xem toàn bộ hệ thống)
router.get("/", employeeAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const query = {}
    if (status) {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .populate(["customerId", "tourId"])
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Booking.countDocuments(query)

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update booking status (chỉ employee/admin mới có quyền cập nhật trạng thái booking)
router.put("/:id/status", employeeAuth, async (req, res) => {
  try {
    const { status } = req.body

    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate([
      "customerId",
      "tourId",
    ])

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // If booking is cancelled, restore tour slots
    if (status === "cancelled") {
      const tour = await Tour.findById(booking.tourId)
      if (tour) {
        tour.availableSlots += booking.numberOfPeople
        await tour.save()
      }
    }

    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
