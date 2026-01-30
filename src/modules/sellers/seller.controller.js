const Seller = require("./seller.model");
const User = require("../auth/user.model");
const logger = require("../../config/logger");
const {
  createSellerSchema,
  updateStatusSchema,
  submitKycSchema,
  verifyKycSchema,
} = require("./seller.validation");

exports.createSellerProfile = async (req, res) => {
  try {
    const validatedData = createSellerSchema.parse(req.body);

    const existingProfile = await Seller.findOne({ user: req.user.id });
    if (existingProfile) {
      return res
        .status(400)
        .json({ success: false, message: "Seller profile already exists" });
    }

    const seller = await Seller.create({
      user: req.user.id,
      ...validatedData,
    });

    // Optionally update User role to 'seller' here or wait for verification
    // For now, we wait for admin approval to verify, but role can be 'seller' with 'pending' status

    res.status(201).json({
      success: true,
      data: seller,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMe = async (req, res) => {
  const seller = await Seller.findOne({ user: req.user.id });
  if (!seller) {
    return res
      .status(404)
      .json({ success: false, message: "No seller profile found" });
  }
  res.status(200).json({ success: true, data: seller });
};

exports.updateSellerStatus = async (req, res) => {
  try {
    const { status } = updateStatusSchema.parse(req.body);

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    seller.status = status;
    await seller.save();

    // If verified, ensure User role is seller
    if (status === "verified") {
      await User.findByIdAndUpdate(seller.user, { role: "seller" });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().populate("user", "name email");
    res
      .status(200)
      .json({ success: true, count: sellers.length, data: sellers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.submitKyc = async (req, res) => {
  try {
    const validatedData = submitKycSchema.parse(req.body);

    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    // Update KYC data
    seller.kyc = {
      ...validatedData,
      verificationStatus: "pending",
    };

    await seller.save();

    res.status(200).json({
      success: true,
      message: "KYC submitted successfully. Pending admin verification.",
      data: seller.kyc,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id }).select(
      "kyc status",
    );
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        kycStatus: seller.kyc?.verificationStatus || "not_submitted",
        sellerStatus: seller.status,
        kyc: seller.kyc,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.verifyKyc = async (req, res) => {
  try {
    const { status, rejectionReason } = verifyKycSchema.parse(req.body);

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    if (!seller.kyc || seller.kyc.verificationStatus === "not_submitted") {
      return res
        .status(400)
        .json({ success: false, message: "KYC not submitted yet" });
    }

    seller.kyc.verificationStatus = status;

    if (status === "verified") {
      seller.kyc.verifiedAt = new Date();
      seller.kyc.verifiedBy = req.user.id;
      seller.status = "verified"; // Auto-verify seller on KYC approval

      // Update user role to seller
      await User.findByIdAndUpdate(seller.user, { role: "seller" });
    } else if (status === "rejected") {
      seller.kyc.rejectionReason = rejectionReason || "Documents not valid";
    }

    await seller.save();

    res.status(200).json({
      success: true,
      message: `KYC ${status === "verified" ? "approved" : "rejected"}`,
      data: seller,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
