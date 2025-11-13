import React from "react";
import SelectedAttributes from "../attributes/SelectedAttributes.jsx";
import ChangeCartItemQuantity from "../ChangeCartItemQuantity.jsx";

export default class CartOverlayItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pricing: { currency: { symbol: "$" }, amount: 0 },
      priceAmount: "0.00",
    };
  }

  // 🟢 FIXED: Works with GraphQL prices, Firebase prices, and fallback
  resolvePrice = (product, currency) => {
    try {
      // Case 1: GraphQL prices array
      if (Array.isArray(product?.prices) && product.prices.length > 0) {
        const found = product.prices.find(
          (p) => p?.currency?.symbol === currency
        );
        if (found) {
          return {
            currency: { symbol: found.currency.symbol },
            amount: Number(found.amount) || 0,
          };
        }
      }

      // Case 2: Firebase simple price: price: 1999
      if (product?.price !== undefined) {
        return {
          currency: { symbol: currency },
          amount: Number(product.price) || 0,
        };
      }

      // Case 3: Broken product → fallback
      return {
        currency: { symbol: currency },
        amount: 0,
      };
    } catch (err) {
      console.error("Price error:", err);
      return {
        currency: { symbol: currency },
        amount: 0,
      };
    }
  };

  componentDidMount() {
    const { singleProduct, selectedCurrency } = this.props;
    const p = this.resolvePrice(singleProduct, selectedCurrency);

    this.setState({
      pricing: p,
      priceAmount: Number(p.amount).toFixed(2),
    });
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.selectedCurrency !== nextProps.selectedCurrency) {
      const p = this.resolvePrice(
        nextProps.singleProduct,
        nextProps.selectedCurrency
      );

      this.setState({
        pricing: p,
        priceAmount: Number(p.amount).toFixed(2),
      });
    }

    return true;
  }

  render() {
    const { singleProduct, handleAddProduct, handleRemoveProduct } =
      this.props;
    const { pricing, priceAmount } = this.state;

    // 🟢 FIXED: Always returns a valid image (gallery OR image OR placeholder)
    const gallery = Array.isArray(singleProduct?.gallery) && singleProduct.gallery.length > 0
      ? singleProduct.gallery
      : singleProduct?.image
      ? [singleProduct.image] // wrap single image
      : ["https://via.placeholder.com/150"]; // fallback

    // Safe attributes
    const attributes = Array.isArray(singleProduct?.attributes)
      ? singleProduct.attributes
      : [];

    return (
      <article className="cartoverlay-products-single">
        <section className="cart-overlay-item">
          <section>
            <section className="titles-block">
              <h4>{singleProduct.name}</h4>

              <p className="product-price">
                {pricing.currency.symbol}
                {priceAmount}
              </p>
            </section>

            {attributes.map((attribute) => (
              <SelectedAttributes
                className="cart-overlay-item-attr"
                key={attribute.id || attribute.attributeId}
                attribute={attribute}
                userSelectedAttributes={
                  singleProduct.userSelectedAttributes
                }
                singleProduct={singleProduct}
              />
            ))}
          </section>
        </section>

        <ChangeCartItemQuantity
          className="cartoverlay-product-interaction"
          handleAddProduct={handleAddProduct}
          handleRemoveProduct={handleRemoveProduct}
          singleProduct={singleProduct}
        />

        {/* 🟢 Always valid image source */}
        <img
          src={gallery[0]}
          alt={singleProduct?.name || "Product"}
          style={{
            width: "120px",
            height: "150px",
            objectFit: "cover",
            borderRadius: "6px",
          }}
        />
      </article>
    );
  }
}
