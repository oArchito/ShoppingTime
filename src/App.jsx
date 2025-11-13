import React, { useCallback, useEffect, useState } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Header from "./components/header/Header.jsx";
import AllProducts from "./routes/all-products/AllProducts.jsx";
import SingleProduct from "./routes/single-product/SingleProduct.jsx";
import Cart from "./routes/cart/Cart.jsx";
import Landing from "./routes/landing/Landing.jsx";
import Checkout from "./routes/checkout/Checkout.jsx";
import NotFound from "./routes/not-found/NotFound.jsx";
import Order from "./routes/order/Order.jsx";
import products_database from "./database/firebase.js";
import { collection, getDocs } from "firebase/firestore/lite";

const App = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("$");
  const [allProducts, setAllProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [productsQuantity, setProductsQuantity] = useState(0);
  const [orderFormValue, setOrderFormValue] = useState({});
  const [cachedProducts, setCachedProducts] = useState([]);
  const [cachedCurrencies, setCachedCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const retrieveProducts = async (db) => {
    const all_products_col = collection(db, "products");
    const productsSnapshot = await getDocs(all_products_col);
    const all_products = productsSnapshot.docs.map((doc) => doc.data());
    return all_products;
  };

  const GetProducts = useCallback(
    async (targetcategory) => {
      setIsLoading(true);
      try {
        let products;
        if (cachedProducts.length === 0) {
          products = await retrieveProducts(products_database);
          setCachedProducts(products);
        } else {
          products = cachedProducts;
        }

        if (!targetcategory || targetcategory === "all") {
          setAllProducts(products);
        } else {
          const targetProducts = products.filter((item) =>
            Object.values(item).includes(targetcategory)
          );
          setAllProducts(targetProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [cachedProducts]
  );

  useEffect(() => {
    // initial load
    const storedActiveCategory = JSON.parse(
      localStorage.getItem("activeCategory")
    );
    const categoryToLoad = storedActiveCategory || activeCategory || "all";
    setActiveCategory(categoryToLoad);
    GetProducts(categoryToLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const clearCart = () => {
    setCartItems([]);
    setProductsQuantity(0);
    localStorage.removeItem("cartItems");
    localStorage.removeItem("productsQuantity");
  };

  const changeCategory = (newCategory) => {
    setActiveCategory(newCategory);
    GetProducts(newCategory);
    localStorage.setItem("activeCategory", JSON.stringify(newCategory));
  };

  useEffect(() => {
    const storedSelectedCurrency = JSON.parse(
      localStorage.getItem("selectedCurrency")
    );
    if (storedSelectedCurrency) {
      setSelectedCurrency(storedSelectedCurrency);
    }
  }, []);

  const changeCurrency = (newSelectedCurrency) => {
    setSelectedCurrency(newSelectedCurrency);
    localStorage.setItem("selectedCurrency", JSON.stringify(newSelectedCurrency));
  };

  const getCurrencies = useCallback(async () => {
    if (cachedCurrencies.length === 0) {
      try {
        const all_currencies = await retrieveCurrencies(products_database);
        setCachedCurrencies(all_currencies);
        setAllCurrencies(all_currencies);
      } catch (error) {
        console.error("Error fetching currencies:", error);
        setAllCurrencies([]);
      }
    } else {
      setAllCurrencies(cachedCurrencies);
    }
  }, [cachedCurrencies]);

  async function retrieveCurrencies(db) {
    try {
      const all_currencies_col = collection(db, "currencies");
      const currenciesSnapshot = await getDocs(all_currencies_col);
      const all_currencies = currenciesSnapshot.docs.map((doc) => doc.data());
      return all_currencies;
    } catch (error) {
      console.error("Error retrieving currencies from Firebase:", error);
      return [];
    }
  }

  useEffect(() => {
    getCurrencies();
  }, [getCurrencies]);

  const MatchingAttributes = (userSelectedAttributes, targetProduct) => {
    const attributesMatch = (groupOne, groupTwo) => {
      return Object.values(groupOne)[1] === Object.values(groupTwo)[1];
    };

    let truthyValuesCounter = 0;
    let i = 0;
    while (i < (userSelectedAttributes?.length || 0)) {
      if (
        attributesMatch(
          userSelectedAttributes[i],
          targetProduct?.userSelectedAttributes?.[i]
        )
      ) {
        truthyValuesCounter += 1;
      }
      i += 1;
    }

    return truthyValuesCounter === (userSelectedAttributes?.length || 0);
  };

  const updateCartQuantity = (actionToPerfrom, productAlreadyInCart, userSelectedAttributes) => {
    const repeatableProduct = CheckRepeatableProducts(
      cartItems,
      productAlreadyInCart,
      userSelectedAttributes
    );
    const indexOfRepeatableProduct = cartItems.indexOf(repeatableProduct);
    const currentProductList = [...cartItems];
    if (indexOfRepeatableProduct === -1) return currentProductList;

    if (actionToPerfrom === "addProduct") {
      currentProductList[indexOfRepeatableProduct].quantity += 1;
    } else {
      currentProductList[indexOfRepeatableProduct].quantity -= 1;
    }

    return currentProductList;
  };

  const CheckRepeatableProducts = (cartItemsArg, targetProduct, userSelectedAttributes) => {
    let item;
    const productsById = (cartItemsArg || []).filter((it) => it.id === targetProduct.id);
    productsById.forEach((p) => {
      if (MatchingAttributes(userSelectedAttributes, p)) {
        item = p;
      }
    });
    return item;
  };

  const handleAddProduct = (targetProduct, userSelectedAttributes = null) => {
    let updatedProductList = [];
    const productAlreadyInCart = CheckRepeatableProducts(
      cartItems,
      targetProduct,
      userSelectedAttributes
    );

    if (productAlreadyInCart) {
      updatedProductList = updateCartQuantity(
        "addProduct",
        productAlreadyInCart,
        userSelectedAttributes
      );
    } else {
      // make deep copy safely
      let modifiedProduct = JSON.parse(JSON.stringify(targetProduct || {}));
      // ensure attributes exist as array
      const attributeCount = modifiedProduct?.attributes?.length || 0;

      for (let i = 0; i < attributeCount; i++) {
        const items = modifiedProduct.attributes[i]?.items || [];
        for (let j = 0; j < items.length; j++) {
          if (
            items[j].value === userSelectedAttributes?.[i]?.value
          ) {
            const clone = {
              ...items[j],
              isSelected: true
            };
            modifiedProduct.attributes[i].items[j] = clone;
          }
        }
      }

      updatedProductList = [
        ...cartItems,
        {
          ...modifiedProduct,
          userSelectedAttributes: userSelectedAttributes || [],
          quantity: 1,
        },
      ];
    }

    // Create unique id safely
    updatedProductList = updatedProductList.map((updatedProduct) => {
      const firstValue = Object.values(updatedProduct.userSelectedAttributes?.[0] || []);
      const secondValue = Object.values(updatedProduct.userSelectedAttributes?.[1] || []);
      const thirdValue = Object.values(updatedProduct.userSelectedAttributes?.[2] || []);
      const pid = updatedProduct.id || "no-id";
      updatedProduct.uniqueId = `${pid}-${firstValue}-${secondValue}-${thirdValue}`;
      return updatedProduct;
    });

    // Update cart items
    setCartItems(updatedProductList);
    localStorage.setItem("cartItems", JSON.stringify(updatedProductList));

    // Update cart quantity
    if (updatedProductList.length <= 1) {
      updatedProductList.forEach((item) => {
        localStorage.setItem("productsQuantity", JSON.stringify(item.quantity));
        setProductsQuantity(item.quantity);
      });
    } else {
      const productListArray = updatedProductList.map((it) => it.quantity || 0);
      const sum = productListArray.reduce((a, b) => a + b, 0);
      setProductsQuantity(sum);
      localStorage.setItem("productsQuantity", JSON.stringify(sum));
    }
  };

  useEffect(() => {
    if (localStorage.getItem("cartItems") !== null) {
      const jsonCartItems = localStorage.getItem("cartItems");
      const parsed = JSON.parse(jsonCartItems) || [];
      setCartItems(parsed);
    }
    if (localStorage.getItem("productsQuantity") !== null) {
      const jsonProductsQuantity = localStorage.getItem("productsQuantity");
      const productsQuantityParsed = JSON.parse(jsonProductsQuantity) || 0;
      setProductsQuantity(productsQuantityParsed);
    }
  }, []);

  const alertMessageMain = () => {
    const alertMessage = document.querySelector(".success-alert");
    if (alertMessage) {
      alertMessage.classList.add("visible");
      setTimeout(() => {
        alertMessage.classList.remove("visible");
      }, 1000);
    }
  };

  const handleRemoveProduct = (targetProduct, userSelectedAttributes) => {
    let updatedProductList = [];
    const repeatableProduct = CheckRepeatableProducts(
      cartItems,
      targetProduct,
      userSelectedAttributes
    );

    if (!repeatableProduct) return;

    if (repeatableProduct.quantity > 1) {
      updatedProductList = updateCartQuantity(
        "removeProduct",
        repeatableProduct,
        userSelectedAttributes
      );
    } else {
      const products = [...cartItems];
      const indexOfProduct = products.indexOf(repeatableProduct);
      if (indexOfProduct !== -1) products.splice(indexOfProduct, 1);
      updatedProductList = products;
    }

    // Update cart items
    setCartItems(updatedProductList);
    localStorage.setItem("cartItems", JSON.stringify(updatedProductList));

    // Update cart quantity
    if (updatedProductList.length <= 1) {
      updatedProductList.forEach((item) => {
        localStorage.setItem("productsQuantity", JSON.stringify(item.quantity || 0));
        setProductsQuantity(item.quantity || 0);
      });
    } else {
      const productListArray = updatedProductList.map((it) => it.quantity || 0);
      const sum = productListArray.reduce((a, b) => a + b, 0);
      setProductsQuantity(sum);
      localStorage.setItem("productsQuantity", JSON.stringify(sum));
    }
    if (updatedProductList.length === 0) {
      setProductsQuantity(0);
      localStorage.setItem("productsQuantity", JSON.stringify(0));
    }
  };

  // ---------- SAFER getPrice ----------
  // Accepts either 'prices' array (original) or 'price' (firebase)
  const getPrice = (pricesOrProduct, currency) => {
    // If caller passed whole product, try to normalize
    // Defensive: pricesOrProduct may be array or product object
    const pricesArray = Array.isArray(pricesOrProduct)
      ? pricesOrProduct
      : pricesOrProduct?.prices;

    if (Array.isArray(pricesArray) && pricesArray.length > 0) {
      const found = pricesArray.find((p) => p?.currency?.symbol === currency);
      if (found) return found;
      // if not found, return first price
      return pricesArray[0];
    }

    // Fallback for product.price numeric field
    const product = !Array.isArray(pricesOrProduct) ? pricesOrProduct : null;
    if (product?.price !== undefined && product.price !== null) {
      return { amount: product.price, currency: { symbol: currency } };
    }

    // final fallback
    return { amount: 0, currency: { symbol: currency } };
  };

  // get total price of cart items (safer)
  const getTotalPrice = useCallback(
    (selectedCurrencyArg, cartItemsArg) => {
      let total = 0;
      for (const item of cartItemsArg || []) {
        const priceObj = getPrice(item?.prices || item, selectedCurrencyArg);
        const amount = (priceObj && priceObj.amount) ? Number(priceObj.amount) : 0;
        const qty = Number(item.quantity || 0);
        total += amount * qty;
      }

      total = parseFloat(total.toFixed(2));
      setTotalPayment(total);
      setTaxes(((total * 21) / 100).toFixed(2));
    },
    [setTotalPayment, setTaxes]
  );

  useEffect(() => {
    getTotalPrice(selectedCurrency, cartItems);
  }, [cartItems, selectedCurrency, getTotalPrice]);

  return (
    <BrowserRouter>
      <Header
        productsQuantity={productsQuantity}
        activeCategory={activeCategory}
        selectedCurrency={selectedCurrency}
        allCurrencies={allCurrencies}
        changeCategory={changeCategory}
        changeCurrency={changeCurrency}
        totalPayment={totalPayment}
        cartItems={cartItems}
        handleRemoveProduct={handleRemoveProduct}
        handleAddProduct={handleAddProduct}
        clearCart={clearCart}
      />

      <Routes>
        <Route path="/" element={<Landing changeCategory={changeCategory} />} />
        <Route
          path={`/store/${activeCategory}`}
          element={
            <AllProducts
              allProducts={allProducts}
              activeCategory={activeCategory}
              selectedCurrency={selectedCurrency}
              handleAddProduct={handleAddProduct}
              alertMessageMain={alertMessageMain}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path={`/store/:id`}
          element={
            <SingleProduct
              selectedCurrency={selectedCurrency}
              handleAddProduct={handleAddProduct}
              alertMessageMain={alertMessageMain}
              allProducts={allProducts}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <Cart
              productsQuantity={productsQuantity}
              cartItems={cartItems}
              selectedCurrency={selectedCurrency}
              totalPayment={totalPayment}
              taxes={taxes}
              handleRemoveProduct={handleRemoveProduct}
              handleAddProduct={handleAddProduct}
              clearCart={clearCart}
            />
          }
        />
        <Route
          path="/checkout"
          element={cartItems.length > 0 ? <Checkout cartItems={cartItems} selectedCurrency={selectedCurrency} setOrderFormValue={setOrderFormValue} /> : <NotFound />}
        />
        <Route
          path="/order"
          element={cartItems.length > 0 && Object.keys(orderFormValue).length > 0 ? <Order cartItems={cartItems} selectedCurrency={selectedCurrency} orderFormValue={orderFormValue} clearCart={clearCart} /> : <NotFound />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
