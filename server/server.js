const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/database")
const path = require("path")

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from public folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/tours", require("./routes/tours"))
app.use("/api/bookings", require("./routes/bookings"))
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/statistics", require("./routes/statistics"))

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Tour Management API is running!" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 API available at http://localhost:${PORT}`)
})
