import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import addToCart from "../../assets/images/add-to-cart.png";
import QuickAddToCart from "./QuickAddToCart";

const Product = ({
  selectedCurrency,
  item,
  handleAddProduct,
  alertMessageMain,
  toggleQuickCart,
  removeQuickAddToCart,
  quickAddToCartVisible,
  setActiveItem,
  activeItem
}) => {
  const [pricing, setPricing] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [imageShadow, setImageShadow] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [allAttributesAreSelected, setAllAttributesAreSelected] = useState(false);

  // Safe fallbacks for missing fields
  const attributes = item?.attributes || [];
  const gallery = item?.gallery?.length ? item.gallery : [item?.image || ""];
  const brand = item?.brand || "Brand";

  // Treat as in stock UNLESS explicitly false
  const inStock = item?.inStock === false ? false : true;

  // Fallback price (some datasets store price differently)
  const fallbackPrice = Number(item?.price) || 0;

  // Price handler
  const filterCurrency = () => {
    if (Array.isArray(item?.prices) && item.prices.length > 0) {
      const correctPrice = item.prices.find(
        (price) => price.currency.symbol === selectedCurrency
      );

      if (correctPrice) {
        setPriceAmount(correctPrice.amount.toFixed(2));
        setPricing(correctPrice);
      }
    } else {
      // Firestore or minimal dataset fallback
      setPricing({ currency: { symbol: selectedCurrency || "$" } });

      const priceNumber = Number(item?.price) || 0;
      setPriceAmount(priceNumber.toFixed(2));
    }
  };

  useEffect(() => {
    filterCurrency();
  }, [item, selectedCurrency]);

  return (
    <div
      className={`product-card ${imageShadow ? "product-shadow" : ""}`}
      style={!inStock ? { opacity: "0.55" } : { opacity: "1" }}
      onMouseEnter={() => setImageShadow(true)}
      onMouseLeave={() => setImageShadow(false)}
    >
      <Link to={`/store/${item.id}`} className="item-preview">
        <div className="img-container">

          {/* OUT OF STOCK badge only when explicitly false */}
          {!inStock ? (
            <p className="out-of-stock-sign">OUT OF STOCK</p>
          ) : null}

          <div
            className="item-preview-img"
            style={{
              backgroundImage: gallery[0] ? `url(${gallery[0]})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              height: "250px",
            }}
          ></div>
        </div>
      </Link>

      <div>
        <p className="brand-name">
          {brand} {item.name}
        </p>

        <p className="product-price">
          {pricing?.currency?.symbol}
          {priceAmount}
        </p>
      </div>

      {/* Show quick add to cart only if in stock */}
      {inStock && (
        activeItem === item.id ? (
          <QuickAddToCart
            handleAddProduct={handleAddProduct}
            item={item}
            toggleQuickCart={toggleQuickCart}
            quickAddToCartVisible={quickAddToCartVisible}
            allAttributesAreSelected={allAttributesAreSelected}
            handleSelectedAttributes={() => {}}
            selectedAttributes={selectedAttributes}
            removeQuickAddToCart={removeQuickAddToCart}
            alertMessageMain={alertMessageMain}
            setActiveItem={setActiveItem}
          />
        ) : (
          <img
            className="quick-buy"
            src={addToCart}
            onClick={() => setActiveItem(item.id)}
            alt="Add to cart icon"
          />
        )
      )}
    </div>
  );
};

export default Product;
