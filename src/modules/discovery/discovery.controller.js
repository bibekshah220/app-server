const { Product } = require("../products/product.model");
const logger = require("../../config/logger");

exports.getNearbyItems = async (req, res) => {
  try {
    const { lat, long, distance = 5, category } = req.query;

    // Validation
    if (!lat || !long) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid latitude (lat) and longitude (long)",
      });
    }

    const radiusInRadians = distance / 6378.1; // Earth radius in km

    let query = {
      isActive: true,
      isDeleted: false,
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [[parseFloat(long), parseFloat(lat)], radiusInRadians],
        },
      },
    };

    if (category) {
      query.category = category;
    }

    // Limit results for performance
    const items = await Product.find(query)
      .populate("seller", "businessName")
      .limit(50);

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
      metadata: {
        searchLocation: { lat, long },
        radiusKm: distance,
      },
    });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
