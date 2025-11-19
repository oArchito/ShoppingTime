import React, { useEffect, useState } from "react";
import SelectedAttributes from "../../components/attributes/SelectedAttributes.jsx";
import SimpleImageSlider from "react-simple-image-slider";
import ChangeCartItemQuantity from "../../components/ChangeCartItemQuantity.jsx";

const CartSingleItem = ({
  selectedCurrency,
  singleProduct,
  handleAddProduct,
  handleRemoveProduct
}) => {
  const [priceAmount, setPriceAmount] = useState("");

  const gallery = singleProduct?.gallery?.length
    ? singleProduct.gallery
    : [singleProduct?.image || ""];
  const brand = singleProduct?.brand || "Brand";
  const attributes = singleProduct?.attributes || [];
  const prices = singleProduct?.prices || [];

  // Convert price safely
  const basePrice = Number(singleProduct?.price) || 0;

  useEffect(() => {
    if (prices.length > 0) {
      const targetCurrency = prices.find(
        (p) => p.currency?.symbol === selectedCurrency
      );
      if (targetCurrency) {
        setPriceAmount(Number(targetCurrency.amount).toFixed(2));
        return;
      }
    }

    // fallback
    setPriceAmount(Number(basePrice).toFixed(2));
  }, [selectedCurrency, prices, basePrice]);

  return (
    <section className="cart-products-single">
      <section className="cart-data">
        <h2 className="product-brand">{brand}</h2>
        <h2 className="product-name">{singleProduct.name}</h2>

        <div className="cart-item-pricing">
          <p className="product-price">
            {selectedCurrency}
            {priceAmount}
          </p>
        </div>

        {attributes.length > 0 &&
          attributes.map((attribute) => (
            <SelectedAttributes
              className="cart-attr"
              key={attribute.id || attribute.attributeId}
              attribute={attribute}
              userSelectedAttributes={singleProduct.userSelectedAttributes}
              singleProduct={singleProduct}
            />
          ))}
      </section>

      <section className="cart-content">
        <ChangeCartItemQuantity
          className="cart-product-interaction"
          handleAddProduct={handleAddProduct}
          handleRemoveProduct={handleRemoveProduct}
          singleProduct={singleProduct}
        />

        {gallery.length > 0 && (
          <SimpleImageSlider
            className="image-slider"
            images={gallery.map((img) => ({ url: img }))}
            showNavs={gallery.length > 1}
            width={290}
            height={288}
          />
        )}
      </section>
    </section>
  );
};

export default CartSingleItem;
