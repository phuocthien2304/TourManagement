const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth');
const Notification = require('../models/Notification');

/**
 * @route   GET api/notifications
 * @desc    Lấy tất cả thông báo cho người dùng đã đăng nhập
 * @access  Private
 */
router.get('/', auth, async (req, res) => { // Luôn cần middleware `auth` để có req.user
    try {
      // Thêm bước kiểm tra để đảm bảo req.user._id tồn tại
      if (!req.user || !req.user._id) {
          return res.status(401).json({ msg: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại.' });
      }
  
      const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        // SỬA LỖI: Sử dụng cú pháp object cho populate để rõ ràng và ổn định hơn
        .populate({
            path: 'sender', // Populate trường 'sender'
            select: 'fullName' // Chỉ lấy trường 'fullName' từ model tương ứng (Customer hoặc Employee)
        });
  
      res.json(notifications);
  
    } catch (err) {
      // Ghi log lỗi đầy đủ hơn để dễ dàng debug
      console.error("LỖI KHI LẤY THÔNG BÁO:", err);
      res.status(500).send('Server Error');
    }
  });

/**
 * @route   PUT api/notifications/:id/read
 * @desc    Đánh dấu một thông báo là đã đọc
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
    try {
      console.log("[SERVER LOG]: req.params.id:", req.params.id);
      console.log("[SERVER LOG]: req.user._id:", req.user._id);
      console.log("[SERVER LOG]: req.user._id type:", typeof req.user._id);
  
      if (!req.params.id) {
        return res.status(400).json({ msg: 'ID thông báo không được cung cấp' });
      }
  
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        return res.status(404).json({ msg: 'Không tìm thấy thông báo' });
      }
  
      console.log("[SERVER LOG]: notification.recipient:", notification.recipient.toString());
      console.log("[SERVER LOG]: notification.recipient type:", typeof notification.recipient.toString());
  
      // So sánh cả hai dưới dạng String
      if (notification.recipient.toString() !== req.user._id.toString()) {
        return res.status(401).json({ msg: 'Không được phép' });
      }
  
      notification.read = true;
      await notification.save();
  
      console.log("[SERVER LOG]: Notification marked as read:", notification._id);
      res.json(notification);
    } catch (err) {
      console.error("[SERVER ERROR]: Error marking notification as read:", err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'ID thông báo không hợp lệ' });
      }
      res.status(500).send('Server Error');
    }
  });

module.exports = router;