import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User', // Ties this product entry to a specific User
    },
    productName: {
      type: String,
      required: [true, 'Please add a product or medicine name'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Grocery', 'Medicine'], // Restricts the input types to match your UI views
    },
    barcode: {
      type: String,
      default: '', // Optional fallback if they input items manually without scanning
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please provide an expiry date'],
    },
    daysBeforeNotification: {
      type: Number,
      default: 7, // Default to notify 7 days before it expires
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Notified', 'Consumed', 'Wasted'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;