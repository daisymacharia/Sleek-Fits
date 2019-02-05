import React from 'react'
import StripeCheckout from 'react-stripe-checkout'
import { Mutation } from 'react-apollo'
import Router from 'next/router'
import NProgress from 'nprogress'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import calcTotalPrice from '../lib/calcTotalPrice'
import Error from './ErrorMessage'
import User, { CURRENT_USER_QUERY } from './User'

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0)
}

class TakeMyMoney extends React.Component {
  onToken = (res, me) => {
    console.log('called')
    console.log(res)
    console.log(me, 'the user')
  }

  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <StripeCheckout
            amount={calcTotalPrice(me.cart)}
            name='Sick Fits'
            description={`Order of ${totalItems(me.cart)} items`}
            // image={me.cart.length > 0 && me.cart[0].item.image}
            stripeKey='pk_test_kMGBSVd1rn8tCl506e5Uxldw'
            currency='USD'
            email={me.email}
            token={res => this.onToken(res, me)}
          >
            {this.props.children}
          </StripeCheckout>
        )}
      </User>
    )
  }
}

export default TakeMyMoney
