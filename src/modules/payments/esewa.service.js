const crypto = require("crypto");

class EsewaService {
  constructor() {
    this.merchantId = process.env.ESEWA_MERCHANT_ID || "EPAYTEST";
    this.secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    this.baseUrl =
      process.env.ESEWA_BASE_URL ||
      "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
  }

  generateSignature(totalAmount, transactionUuid, productCode) {
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const hmac = crypto.createHmac("sha256", this.secretKey);
    hmac.update(signatureString);
    return hmac.digest("base64");
  }

  verifySignature(
    responseSignature,
    totalAmount,
    transactionUuid,
    productCode,
  ) {
    const calculatedSignature = this.generateSignature(
      totalAmount,
      transactionUuid,
      productCode,
    );
    return responseSignature === calculatedSignature;
  }

  decodeResponse(encodedData) {
    try {
      const buff = Buffer.from(encodedData, "base64");
      const str = buff.toString("utf-8");
      return JSON.parse(str);
    } catch (error) {
      console.error("Error decoding eSewa response:", error);
      return null;
    }
  }

  getPaymentParams(
    amount,
    taxAmount,
    serviceCharge,
    deliveryCharge,
    transactionUuid,
  ) {
    const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;
    const signature = this.generateSignature(
      totalAmount,
      transactionUuid,
      this.merchantId,
    );

    return {
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: this.merchantId,
      product_service_charge: serviceCharge,
      product_delivery_charge: deliveryCharge,
      success_url: `${process.env.API_URL}/api/v1/payments/esewa/success`,
      failure_url: `${process.env.API_URL}/api/v1/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };
  }
}

module.exports = new EsewaService();
