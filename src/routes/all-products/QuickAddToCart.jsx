import React, { useEffect } from "react";
import Attribute from "../../components/attributes/Attributes.jsx";
import AddToCartButton from "../../components/AddToCartButton.jsx";

const QuickAddToCart = ({
  item,
  handleAddProduct,
  handleSelectedAttributes,
  selectedAttributes,
  allAttributesAreSelected,
  alertMessageMain,
  toggleQuickCart,
  setActiveItem,
}) => {
  // ✅ Determine if the product has attributes
  const hasAttributes = item?.attributes?.length > 0;

  // ✅ If there are no attributes, treat as fully selectable
  useEffect(() => {
    if (!hasAttributes) {
      // Mark all attributes as selected automatically
      // This ensures Add to Cart button is enabled
      handleSelectedAttributes("default", "none");
    }
  }, [hasAttributes, handleSelectedAttributes]);

  return (
    <section className="quick-addto-cart">
      {/* ✅ Render attributes only if they exist */}
      {hasAttributes &&
        item.attributes.map((attribute) => (
          <Attribute
            className="quick-attribute"
            key={attribute.id}
            attribute={attribute}
            handleSelectedAttributes={handleSelectedAttributes}
            selectedAttributes={selectedAttributes}
          />
        ))}

      {/* ✅ Enable Add to Cart even if no attributes exist */}
      <AddToCartButton
        className="quick-addtocart"
        handleAddProduct={handleAddProduct}
        item={item}
        // ⬇️ If no attributes, always allow button click
        allAttributesAreSelected={hasAttributes ? allAttributesAreSelected : true}
        selectedAttributes={selectedAttributes}
        alertMessageMain={alertMessageMain}
        toggleQuickAddToCart={toggleQuickCart}
        setActiveItem={setActiveItem}
      />

      <p className="close-quickbuy" onClick={() => setActiveItem(null)}>
        close
      </p>
    </section>
  );
};

export default QuickAddToCart;
