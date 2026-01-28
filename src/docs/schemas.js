/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [buyer, seller, admin]
 *         isVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Seller:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         businessName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, verified, suspended]
 *         commissionRate:
 *           type: number
 *         socialProfiles:
 *           type: object
 *           properties:
 *             instagram:
 *               type: string
 *             facebook:
 *               type: string
 *             tiktok:
 *               type: string
 *
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         seller:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         inventory:
 *           type: integer
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         seller:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               name:
 *                 type: string
 *               qty:
 *                 type: integer
 *               price:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, paid, shipped, delivered, completed, cancelled, refunded]
 *         shippingAddress:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zip:
 *               type: string
 *             phone:
 *               type: string
 *
 *     Wallet:
 *       type: object
 *       properties:
 *         seller:
 *           type: string
 *         balance:
 *           type: number
 *         escrowBalance:
 *           type: number
 *         totalEarnings:
 *           type: number
 *         totalCommissionPaid:
 *           type: number
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 */

module.exports = {};
