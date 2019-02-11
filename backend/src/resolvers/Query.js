const { forwardTo } = require('prisma-binding')
const { hasPermission } = require('../utils')

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),

  async me(parent, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
      return null
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    )
  },

  async users(parent, args, ctx, info) {
    // 1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in')
    }
    console.log('the user')
    // 2. Check is the user has the permission to query all the users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])
    // 3. Query all users
    return ctx.db.query.users({}, info)
  },
  async order(parent, args, ctx, info) {
    // 1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in')
    }
    // 2. Query the current order
    const order = ctx.db.query.order(
      {
        where: { id: args.id },
      },
      info
    )
    // 3. check if they have permissinons to see the order
    const ownsOrder = order.user.id === ctx.request.userId
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    )
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error('You cant see this')
    }
    // 4. return the order
    return order
  },
}

module.exports = Query
