import React from "react";
import PropTypes from "prop-types";
import formatMoney from "../lib/formatMoney";
import styled from "styled-components";
import RemoveFromCart from "./RemoveFromCart";

const CartItemStyles = styled.li`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: centre;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightGrey};
  img {
    margin-right: 10px;
  }
  h3,
  p {
    margin: 0;
    font-size: 20px;
  }
`;

const CartItem = ({ cartItem }) =>  {
  // Check if item exists
  if(!cartItem.item) return
    <CartItemStyles><p> This item has been removed</p>
      <RemoveFromCart id={cartItem.id}/>
    </CartItemStyles>

  return(
  <CartItemStyles>
    <img width="100" src={ cartItem.item.image } alt="" />
    <div className="cart-item-detals">
      <h3>{cartItem.item.title}</h3>
      <p>
        {formatMoney(cartItem.item.price * cartItem.quantity)}
        {"-"}
        <em>
          {cartItem.quantity} &times; {cartItem.item.price} each
        </em>
      </p>
    </div>
	<RemoveFromCart id={cartItem.id}/>
  </CartItemStyles>
)
};

CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired
};

export default CartItem;
