// Upload Controller
exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  // Construct file URL (assuming static files are served from /uploads)
  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
    },
  });
};
