const jwt = require("jsonwebtoken")
const Customer = require("../models/Customer")
const Employee = require("../models/Employee")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    let user = await Customer.findById(decoded.id)
    if (!user) {
      user = await Employee.findById(decoded.id)
    }

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only." })
      }
      next()
    })
  } catch (error) {
    res.status(401).json({ message: "Authorization failed" })
  }
}

module.exports = { auth, adminAuth }
