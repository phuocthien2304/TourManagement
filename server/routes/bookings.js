const express = require("express")
const Booking = require("../models/Booking")
const Tour = require("../models/Tour")
const { auth, customerAuth, employeeAuth } = require("../middleware/auth")
const Employee = require("../models/Employee")
const Notification = require("../models/Notification")
const Customer = require("../models/Customer")

const router = express.Router()

// Generate unique booking ID
const generateBookingId = () => {
  return "BOOK" + Date.now() + Math.floor(Math.random() * 1000)
}

// Create booking (chỉ customer được phép tạo booking)
router.post("/", customerAuth, async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ msg: "Chỉ khách hàng mới được tạo booking" })
  }

  const { tourId, numberOfPeople, notes } = req.body
  try {
    const tour = await Tour.findById(tourId)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }
    if (tour.availableSlots < numberOfPeople) {
      return res.status(400).json({ message: "Not enough available slots" })
    }
    const totalAmount = tour.price * numberOfPeople
    const booking = new Booking({
      bookingId: generateBookingId(),
      customerId: req.user._id,
      tourId,
      numberOfPeople,
      totalAmount,
      notes,
    })
    await booking.save()
    console.log("[SERVER LOG]: Booking created:", { bookingId: booking._id, tourId, customerId: req.user._id })

    try {
      const admin = await Employee.findOne({ role: "admin" })
      if (admin) {
        const notification = new Notification({
          recipient: admin._id,
          recipientModel: "Employee",
          sender: req.user._id,
          senderModel: "Customer",
          type: "new_booking",
          message: `Khách hàng ${req.user.fullName} vừa đặt tour "${tour.tourName}".`,
          link: `/admin?tab=bookings`,
        })
        await notification.save()
        console.log("[SERVER LOG]: Notification saved for admin:", admin._id)

        const adminSocket = req.getUser(admin._id.toString())
        if (adminSocket) {
          console.log("[SERVER LOG]: Sending getNotification to admin socket:", adminSocket.socketId)
          req.io.to(adminSocket.socketId).emit("getNotification", {
            type: "new_booking",
            data: {
              bookingId: booking._id,
              tourName: tour.tourName,
              customerName: req.user.fullName,
              message: `Khách hàng ${req.user.fullName} vừa đặt tour "${tour.tourName}".`,
            },
          })
        } else {
          console.log("[SERVER LOG]: Admin not online:", admin._id)
        }
      } else {
        console.log("[SERVER LOG]: No admin found")
      }
    } catch (notificationError) {
      console.error("[SERVER ERROR]: Error in creating or sending notification:", notificationError.message)
    }

    tour.availableSlots -= numberOfPeople
    await tour.save()

    await booking.populate(["customerId", "tourId"])
    res.status(201).json(booking)
  } catch (error) {
    console.error("[SERVER ERROR]: Error in booking creation:", error.message)
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
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate(
      "tourId customerId",
    )

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (status === "cancelled") {
      const tour = await Tour.findById(booking.tourId)
      if (tour) {
        tour.availableSlots += booking.numberOfPeople
        await tour.save()
      }
    }

    // Sửa lại phần notification khi status là 'confirmed'
    if (status === "confirmed") {
      try {
        // Đảm bảo customerId đã được populate
        const customerId = booking.customerId._id || booking.customerId

        const notification = new Notification({
          recipient: customerId,
          recipientModel: "Customer",
          sender: req.user._id,
          senderModel: "Employee",
          type: "booking_confirmation",
          message: `Booking cho tour "${booking.tourId.tourName}" của bạn đã được xác nhận.`,
          link: "/bookings",
        })
        await notification.save()
        console.log("[SERVER LOG]: Notification saved for customer:", customerId)

        // Gửi thông báo qua socket
        const customerSocket = req.getUser(customerId.toString())
        if (customerSocket) {
          console.log("[SERVER LOG]: Sending notification to customer socket:", customerSocket.socketId)
          req.io.to(customerSocket.socketId).emit("getNotification", {
            type: "booking_status_update",
            data: {
              bookingId: booking._id,
              tourName: booking.tourId.tourName,
              status: booking.status,
              message: `Đơn đặt tour "${booking.tourId.tourName}" của bạn đã được xác nhận.`,
            },
          })
        } else {
          console.log("[SERVER LOG]: Customer not online:", customerId)
        }
      } catch (notificationError) {
        console.error(
          "[SERVER ERROR]: Error in creating or sending confirmation notification:",
          notificationError.message,
        )
        // Không return ở đây để vẫn trả về booking đã cập nhật
      }
    }

    // Gửi thông báo cho các trạng thái khác
    if (status !== "confirmed") {
      try {
        const customerId = booking.customerId._id || booking.customerId
        const customerSocket = req.getUser(customerId.toString())

        if (customerSocket) {
          req.io.to(customerSocket.socketId).emit("getNotification", {
            type: "booking_status_update",
            data: {
              bookingId: booking._id,
              tourName: booking.tourId.tourName,
              status: booking.status,
              message: `Đơn đặt tour "${booking.tourId.tourName}" của bạn đã được ${status === "cancelled" ? "hủy" : "đánh dấu đã thanh toán"}.`,
            },
          })
        }
      } catch (socketError) {
        console.error("[SERVER ERROR]: Error sending socket notification:", socketError.message)
      }
    }

    res.json(booking)
  } catch (error) {
    console.error("[SERVER ERROR]: Error in updating booking status:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
