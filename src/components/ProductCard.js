'use client'

import { useState } from "react";

export default function ProductCard({ product }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="border p-4 rounded shadow">

      <img
        src={product.image || "https://via.placeholder.com/150"}
        alt={product.title}
        className="w-full h-40 object-cover"
      />

      <h2 className="text-lg font-bold">{product.title}</h2>

      <p className="text-gray-600">{product.description}</p>

      <p>Price: ₹{product.price}</p>
      <p>Category: {product.category}</p>

      <p>
        Stock: {product.stock > 0 ? "In Stock" : "Out of Stock"}
      </p>

      <p>Rating: {product.ratingsAverage}</p>

      {/* ⭐ Star Rating UI */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`cursor-pointer text-xl ${
              (hover || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>

      {/* Selected Rating */}
      <p className="text-sm text-gray-500">
        Selected: {rating || "None"}
      </p>

      {/* Comment */}
      <textarea
        placeholder="Write review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded p-2 text-sm mb-2"
      />

      <p>Reviews: {product.ratingsCount}</p>

    </div>
  );
}