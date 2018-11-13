const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { makeANiceEmail, transport } = require("../mail");
const { hasPermission } = require("../utils");

const Mutations = {
	async createItem(parent, args, ctx, info) {
		if (!ctx.request.userId) {
			throw new Error("You must be logged in to create an item");
		}
		const item = await ctx.db.mutation.createItem(
			{
				data: {
					// This is how you create a relationship btwn the item and the user
					user: {
						connect: {
							id: ctx.request.userId
						}
					},
					...args
				}
			},
			info
		);
		return item;
	},

	updateItem(parent, args, ctx, info) {
		// First take a copy of the updates
		const updates = { ...args };
		// remove the id from the updates
		delete updates.id;
		// run the update method
		return ctx.db.mutation.updateItem(
			{
				data: updates,
				where: {
					id: args.id
				}
			},
			info
		);
	},

	async deleteItem(parent, args, ctx, info) {
		const where = { id: args.id };
		// 1. find the item
		const item = await ctx.db.query.item({ where }, `{id, title, user {id}}`);
		// 2. check if they own it or have the permissions
		const ownsItem = item.user.id === ctx.request.userId;
		const hasPermissions = ctx.request.user.permissions.some(permission =>
			["ADMIN", "ITEMDELETE"].includes(permission)
		);
		if (!ownsItem && !hasPermissions) {
			throw new Error("You do not have permission to do that");
		}
		// 3. delete it
		return ctx.db.mutation.deleteItem({ where }, info);
	},

	async signup(parent, args, ctx, info) {
		args.email = args.email.toLowerCase(); // lowercase the email
		const password = await bcrypt.hash(args.password, 10); // hash the password

		// create user in db
		const user = await ctx.db.mutation.createUser(
			{
				data: {
					...args,
					password,
					permissions: { set: ["USER"] }
				}
			},
			info
		);
		// create JWT token for created user
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

		// set JWT as cookie on the response
		ctx.response.cookie("token", token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
		});
		return user;
	},

	async signin(parent, { email, password }, ctx, info) {
		// 1. check if there is a user with that email
		const user = await ctx.db.query.user({ where: { email } });
		if (!user) {
			throw new Error(`No such user found for ${email}`);
		}
		// 2. check if their password is correct
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			throw new Error(`Invalid password!`);
		}
		// 3. generate jwt token
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// 4. set JWT as cookie on the response
		ctx.response.cookie("token", token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
		});
		return user;
	},

	signout(parent, { email, password }, ctx, info) {
		ctx.response.clearCookie("token");
		return { message: "Goodbye!" };
	},

	async requestReset(parent, args, ctx, info) {
		// 1. Check whether this is a real user
		const user = await ctx.db.query.user({ where: { email: args.email } });
		if (!user) {
			throw new Error(`No such user found for ${args.email}`);
		}
		// 2. Set reset token and expiry
		const randomBytesPromisified = promisify(randomBytes);
		const resetToken = (await randomBytesPromisified(20)).toString("hex");
		const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

		const res = await ctx.db.mutation.updateUser({
			where: { email: args.email },
			data: { resetToken, resetTokenExpiry }
		});
		// 3. Email the user the reset token
		const mailRes = await transport.sendMail({
			from: "daisy.com",
			to: user.email,
			subject: "Your password Reset Token",
			html: makeANiceEmail(
				`Your password reset token is here! \n\n
				<a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}
				"> Click here to reset</a>`
			)
		});
		// 4. Return the message
		return { message: "Thanks" };
	},

	async resetPassword(parent, args, ctx, info) {
		// 1. First check if passwords match
		if (args.password !== args.confirmPassword) {
			throw new Error(`Passwords do not match`);
		}
		// 2. check if the reset token is legit or expired
		const [user] = await ctx.db.query.users({
			where: {
				resetToken: args.resetToken,
				resetTokenExpiry_gte: Date.now() - 3600000
			}
		});
		if (!user) {
			throw new Error("This token is either expired on invalid");
		}
		// 3. Hash new passwords
		const password = await bcrypt.hash(args.password, 10);
		// 4. save new password to user and remove old rest token field
		const updatedUser = await ctx.db.mutation.updateUser(
			{
				where: {
					email: user.email
				},
				data: {
					password,
					resetToken: null,
					resetTokenExpiry: null
				}
			},
			info
		);
		// 5. Generate jwt
		const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
		// 6. set the JWT to cookies
		ctx.response.cookie("token", token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // One year
		});
		// 7. return new user
		return user;
	},

	async updatePermissions(parent, args, ctx, info) {
		// 1. Check if they are logged in
		if (!ctx.request.userId) {
			throw new Error("You must be logged in");
		}
		// Query the current users
		const currentUser = await ctx.db.query.user(
			{
				where: { id: ctx.request.userId }
			},
			info
		);
		console.log(currentUser);

		// check if they have the required updatePermissions
		hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);

		// update the permission
		return ctx.db.mutation.updateUser(
			{
				where: { id: args.userId },
				data: { permissions: { set: args.permissions } }
			},
			info
		);
	},

	async addToCart(parent, args, ctx, info) {
		// 1. make sure th euser is signed in
		const { userId } = ctx.request;
		if (!userId) {
			throw new Error("You must be signed in");
		}
		// 2. query the users current cart
		const [existingCartItem] = await ctx.db.query.cartItems(
			{
				where: {
					user: { id: userId },
					item: { id: args.id }
				}
			},
			info
		);
		// 3. checkif the item is already in their cart and increament it by 1 if it exists.
		if (existingCartItem) {
			console.log("This item already exists");
			return ctx.db.mutation.updateCartItem(
				{
					where: { id: existingCartItem.id },
					data: {
						quantity: existingCartItem.quantity + 1
					}
				},
				info
			);
		}
		// 4. it if is not, create a fresh CartItem for the user
		return ctx.db.mutation.createCartItem(
			{
				data: {
					user: {
						connect: { id: userId }
					},
					item: {
						connect: {
							id: args.id
						}
					}
				}
			},
			info
		);
	},

	async removeFromCart(parent, args, ctx, info) {
		// 1. First find the cart item
		const cartItem =  await ctx.db.query.cartItem({where: {id: args.id}}, `{id, user { id }}`)
		if(!cartItem) throw new Error("Item does not exist")
		// 2. make sure they own the item
		ownsItem = cartItem.user.id === ctx.request.userId
		if(!ownsItem) throw new Error("You do not own this item ")
		// 3. delete the cart item
		if(ownsItem && cartItem) {
			return ctx.db.mutation.deleteCartItem({where: {id: args.id}}, info)
		}
	}
};

module.exports = Mutations;
