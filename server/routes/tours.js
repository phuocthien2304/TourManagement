const express = require("express")
const Tour = require("../models/Tour")
const { employeeAuth } = require("../middleware/auth")
const multer = require("multer")
const path = require("path")
const fs = require("fs")


const router = express.Router()

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../client/public/uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../client/public/uploads")
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Sanitize tourName to remove special characters
    const tourName = req.body.tourName
      ? req.body.tourName.replace(/[^a-zA-Z0-9]/g, "_")
      : "tour"
    // Add timestamp to avoid conflicts
    const timestamp = Date.now()
    // Calculate index based on number of files already processed
    const index = req.files ? req.files.length + 1 : 1
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${tourName}_${timestamp}_${index}${ext}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Chỉ chấp nhận file .jpg, .jpeg, hoặc .png!"))
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array("images", 5) // Allow up to 5 images

// Generate unique tour ID
const generateTourId = () => {
  return "TOUR" + Date.now() + Math.floor(Math.random() * 1000)
}

// Get tour categories and destinations from database
router.get("/categories", async (req, res) => {
  try {
    // Get categories with counts
    const categoryStats = await Tour.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          destinations: { $addToSet: "$destination" },
          countries: { $addToSet: "$country" },
        },
      },
    ])

    // Get regions with counts
    const regionStats = await Tour.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: { category: "$category", region: "$region" },
          count: { $sum: 1 },
          destinations: { $addToSet: "$destination" },
        },
      },
    ])

    // Get all unique destinations and countries
    const destinations = await Tour.distinct("destination", { status: "active" })
    const countries = await Tour.distinct("country", { status: "active" })
    const departures = await Tour.distinct("departure", { status: "active" })

    // Total tours
    const totalTours = await Tour.countDocuments({ status: "active" })

    // Format response
    const categories = {
      all: { name: "Tất cả Tours", count: totalTours },
    }

    const regions = {
      domestic: {
        "mien-bac": { name: "Miền Bắc", count: 0, destinations: [] },
        "mien-trung": { name: "Miền Trung", count: 0, destinations: [] },
        "mien-nam": { name: "Miền Nam", count: 0, destinations: [] },
      },
      international: {
        "dong-nam-a": { name: "Đông Nam Á", count: 0, destinations: [] },
        "dong-a": { name: "Đông Á", count: 0, destinations: [] },
        "chau-au": { name: "Châu Âu", count: 0, destinations: [] },
        "chau-my": { name: "Châu Mỹ", count: 0, destinations: [] },
        "chau-uc": { name: "Châu Úc", count: 0, destinations: [] },
        "chau-phi": { name: "Châu Phi", count: 0, destinations: [] },
        other: { name: "Khác", count: 0, destinations: [] },
      },
    }

    // Process category stats
    categoryStats.forEach((cat) => {
      categories[cat._id] = {
        name: cat._id === "domestic" ? "Tour Trong Nước" : "Tour Nước Ngoài",
        count: cat.count,
        destinations: cat.destinations,
        countries: cat.countries,
      }
    })

    // Process region stats
    regionStats.forEach((region) => {
      const { category, region: regionKey } = region._id
      if (regions[category] && regions[category][regionKey]) {
        regions[category][regionKey].count = region.count
        regions[category][regionKey].destinations = region.destinations
      }
    })

    res.json({
      categories,
      regions,
      destinations,
      countries,
      departures,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all tours (public)
router.get("/", async (req, res) => {
  try {
    const {
      destination,
      departure,
      country,
      category,
      region,
      tourType,
      difficulty,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      featured,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query

    const query = { status: "active" }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" }
    }

    if (departure) {
      query.departure = { $regex: departure, $options: "i" }
    }

    if (country) {
      query.country = { $regex: country, $options: "i" }
    }

    if (category) {
      query.category = category
    }

    if (region) {
      query.region = region
    }

    if (tourType) {
      query.tourType = tourType
    }

    if (difficulty) {
      query.difficulty = difficulty
    }

    if (featured === "true") {
      query.featured = true
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    if (minDuration || maxDuration) {
      query.duration = {}
      if (minDuration) query.duration.$gte = Number(minDuration)
      if (maxDuration) query.duration.$lte = Number(maxDuration)
    }

    // Sorting
    let sortOption = { createdAt: -1 } // default: newest
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 }
        break
      case "price-low":
        sortOption = { price: 1 }
        break
      case "price-high":
        sortOption = { price: -1 }
        break
      case "popular":
        sortOption = { reviewCount: -1, rating: -1 }
        break
      case "rating":
        sortOption = { rating: -1, reviewCount: -1 }
        break
      case "duration-short":
        sortOption = { duration: 1 }
        break
      case "duration-long":
        sortOption = { duration: -1 }
        break
      case "name-asc":
        sortOption = { tourName: 1 }
        break
      case "name-desc":
        sortOption = { tourName: -1 }
        break
      default:
        sortOption = { featured: -1, createdAt: -1 }
    }

    const tours = await Tour.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOption)

    const total = await Tour.countDocuments(query)

    res.json({
      tours,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Get tour by ID
router.get("/:id", async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" })
    }
    res.json(tour)
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Create tour (Admin only)
router.post("/", employeeAuth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }
    try {
      const images = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : []

      const tourData = {
        ...req.body,
        tourId: generateTourId(),
        images,
        price: Number.parseFloat(req.body.price),
        availableSlots: Number.parseInt(req.body.availableSlots),
        services: req.body.services ? req.body.services.filter((s) => s.trim() !== "") : []
      }

      const tour = new Tour(tourData)
      await tour.save()

      res.status(201).json(tour)
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message })
    }
  })
})

// Update tour (Admin only)
router.put("/:id", employeeAuth, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" })
    }

    // Handle image updates
    const imagesToRemove = req.body.imagesToRemove
      ? Array.isArray(req.body.imagesToRemove)
        ? req.body.imagesToRemove
        : [req.body.imagesToRemove]
      : []
    const newImages = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : []

    // Remove specified images from filesystem and database
    const currentImages = tour.images.filter(
      (img) => !imagesToRemove.includes(img)
    )
    imagesToRemove.forEach((img) => {
      // Remove leading slash from img to avoid path issues
      const relativePath = img.startsWith('/') ? img.slice(1) : img
      const filePath = path.join(__dirname, "../../client/public", relativePath)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })

    // Combine remaining images with new ones
    const updatedImages = [...currentImages, ...newImages]

    const updatedData = {
      ...req.body,
      images: updatedImages,
      price: Number.parseFloat(req.body.price),
      availableSlots: Number.parseInt(req.body.availableSlots),
      services: req.body.services ? req.body.services.filter((s) => s.trim() !== "") : []
    }

    const updatedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    )

    res.json(updatedTour)
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

// Delete tour (Admin only)
router.delete("/:id", employeeAuth, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" })
    }

    // Delete associated images from filesystem
    tour.images.forEach((img) => {
      // Remove leading slash from img to avoid path issues
      const relativePath = img.startsWith('/') ? img.slice(1) : img
      const filePath = path.join(__dirname, "../../client/public", relativePath)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })

    await Tour.findByIdAndDelete(req.params.id)
    res.json({ message: "Xóa tour thành công" })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
})

module.exports = router