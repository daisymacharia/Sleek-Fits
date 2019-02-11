import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'
import { format } from 'date-fns'
import Head from 'next/head'
import formatMoney from '../lib/formatMoney'
import Error from '../components/ErrorMessage'
import OrderStyles from './styles/OrderStyles'

const SINGLE_ORDER_QUERY = gql`
  query SINGLE_ORDER_QUERY($id: ID!) {
    order(id: $id) {
      id
      charge
      total
      createdAt
      user {
        id
      }
      items {
        id
        title
        description
        price
        image
        quantity
      }
    }
  }
`
class Order extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
  }
  render() {
    return (
      <div>
        <p>Order id: {this.props.id}</p>
      </div>
    )
  }
}

export default Order
