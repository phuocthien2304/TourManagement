const express = require("express")
const router = express.Router()
const Tour = require("../models/Tour") // Adjust path to your Tour model

// Get related tours by destination (excluding current tour)
router.get("/related/:tourId", async (req, res) => {
  try {
    const { tourId } = req.params
    const { destination, limit = 6 } = req.query

    if (!destination) {
      return res.status(400).json({
        message: "Destination parameter is required",
      })
    }

    // Find tours with same destination, excluding current tour
    // Use tourId field instead of _id since your schema uses custom tourId
    const relatedTours = await Tour.find({
      tourId: { $ne: tourId }, // Exclude current tour using tourId field
      destination: { $regex: new RegExp(destination, "i") }, // Case-insensitive search
      status: "active", // Only active tours
      availableSlots: { $gt: 0 }, // Only tours with available slots
    })
      .select(
        "tourId tourName destination departure startDate endDate price images availableSlots transportation category region country duration tourType difficulty rating reviewCount",
      )
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(Number.parseInt(limit))

    res.json(relatedTours)
  } catch (error) {
    console.error("Error fetching related tours:", error)
    res.status(500).json({
      message: "Lỗi server khi lấy tour liên quan",
      error: error.message,
    })
  }
})

// Get tours by destination with pagination and sorting
router.get("/by-destination", async (req, res) => {
  try {
    const {
      destination,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      priceMin,
      priceMax,
      category,
      region,
      tourType,
      difficulty,
    } = req.query

    if (!destination) {
      return res.status(400).json({
        message: "Destination parameter is required",
      })
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Build query object
    const query = {
      destination: { $regex: new RegExp(destination, "i") },
      status: "active",
    }

    // Add filters
    if (category) query.category = category
    if (region) query.region = region
    if (tourType) query.tourType = tourType
    if (difficulty) query.difficulty = difficulty

    // Add price filter if provided
    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number.parseInt(priceMin)
      if (priceMax) query.price.$lte = Number.parseInt(priceMax)
    }

    // Build sort object
    let sortObject = {}
    switch (sortBy) {
      case "price-asc":
        sortObject = { price: 1 }
        break
      case "price-desc":
        sortObject = { price: -1 }
        break
      case "date-asc":
        sortObject = { startDate: 1 }
        break
      case "date-desc":
        sortObject = { startDate: -1 }
        break
      case "name-asc":
        sortObject = { tourName: 1 }
        break
      case "name-desc":
        sortObject = { tourName: -1 }
        break
      case "rating-desc":
        sortObject = { rating: -1, reviewCount: -1 }
        break
      case "featured":
        sortObject = { featured: -1, createdAt: -1 }
        break
      default:
        sortObject = { createdAt: -1 }
    }

    const tours = await Tour.find(query)
      .select(
        "tourId tourName destination departure startDate endDate price images availableSlots transportation category region country duration tourType difficulty rating reviewCount featured",
      )
      .sort(sortObject)
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const totalTours = await Tour.countDocuments(query)
    const totalPages = Math.ceil(totalTours / Number.parseInt(limit))

    res.json({
      tours,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalTours,
        hasNextPage: Number.parseInt(page) < totalPages,
        hasPrevPage: Number.parseInt(page) > 1,
        limit: Number.parseInt(limit),
      },
      filters: {
        destination,
        sortBy,
        priceMin,
        priceMax,
        category,
        region,
        tourType,
        difficulty,
      },
    })
  } catch (error) {
    console.error("Error fetching tours by destination:", error)
    res.status(500).json({
      message: "Lỗi server khi lấy tour theo điểm đến",
      error: error.message,
    })
  }
})

// Get popular destinations (for suggestions)
router.get("/popular-destinations", async (req, res) => {
  try {
    const { limit = 10, category, region } = req.query

    // Build match query
    const matchQuery = {
      status: "active",
      availableSlots: { $gt: 0 },
    }

    if (category) matchQuery.category = category
    if (region) matchQuery.region = region

    const popularDestinations = await Tour.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: "$destination",
          tourCount: { $sum: 1 },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: "$reviewCount" },
          sampleImage: { $first: "$images" },
          category: { $first: "$category" },
          region: { $first: "$region" },
          country: { $first: "$country" },
        },
      },
      {
        $sort: { tourCount: -1, avgRating: -1 },
      },
      {
        $limit: Number.parseInt(limit),
      },
      {
        $project: {
          destination: "$_id",
          tourCount: 1,
          minPrice: { $round: "$minPrice" },
          maxPrice: { $round: "$maxPrice" },
          avgPrice: { $round: "$avgPrice" },
          avgRating: { $round: ["$avgRating", 1] },
          totalReviews: 1,
          sampleImage: { $arrayElemAt: ["$sampleImage", 0] },
          category: 1,
          region: 1,
          country: 1,
          _id: 0,
        },
      },
    ])

    res.json(popularDestinations)
  } catch (error) {
    console.error("Error fetching popular destinations:", error)
    res.status(500).json({
      message: "Lỗi server khi lấy điểm đến phổ biến",
      error: error.message,
    })
  }
})

// Get tour recommendations based on user preferences
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 6, category, region, priceMax } = req.query

    // Build query for recommendations
    const query = {
      status: "active",
      availableSlots: { $gt: 0 },
    }

    if (category) query.category = category
    if (region) query.region = region
    if (priceMax) query.price = { $lte: Number.parseInt(priceMax) }

    // Get recommended tours (you can enhance this with user history)
    const recommendedTours = await Tour.find(query)
      .select(
        "tourId tourName destination departure startDate endDate price images availableSlots transportation category region country duration tourType difficulty rating reviewCount featured",
      )
      .sort({
        featured: -1, // Featured tours first
        rating: -1, // High rated tours
        reviewCount: -1, // Popular tours
        createdAt: -1, // Recent tours
      })
      .limit(Number.parseInt(limit))

    res.json(recommendedTours)
  } catch (error) {
    console.error("Error fetching tour recommendations:", error)
    res.status(500).json({
      message: "Lỗi server khi lấy tour gợi ý",
      error: error.message,
    })
  }
})



module.exports = router
