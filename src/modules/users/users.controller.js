const User = require("../auth/user.model");
const logger = require("../../config/logger");
const { z } = require("zod");

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  phone: z.string().min(10),
  isDefault: z.boolean().optional(),
});

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.user.id, validatedData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(
      req.body,
    );

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");
    res.status(200).json({ success: true, data: user.addresses || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
//   Add new address
exports.addAddress = async (req, res) => {
  try {
    const address = addressSchema.parse(req.body);

    const user = await User.findById(req.user.id);

    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the first or marked as default, make it default
    if (user.addresses.length === 0 || address.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      address.isDefault = true;
    }

    user.addresses.push(address);
    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ success: false, message: err.errors });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//   Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const index = parseInt(req.params.index);

    if (!user.addresses || index >= user.addresses.length) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    user.addresses.splice(index, 1);
    await user.save();

    res.status(200).json({ success: true, data: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
//    Reveal user's contact info
exports.revealContact = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select(
      "+phone settings",
    );
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Logic: Log who revealed whose contact
    logger.info(`User ${req.user.id} revealed contact of ${targetUser._id}`);

    // Return the phone number
    res.status(200).json({
      success: true,
      data: {
        phone: targetUser.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
