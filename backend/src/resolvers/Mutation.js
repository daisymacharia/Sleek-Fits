const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");

const Mutations = {
	async createItem(parent, args, ctx, info) {
		// TODO check if user is logged in
		const item = await ctx.db.mutation.createItem(
			{
				data: { ...args }
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
		const item = await ctx.db.query.item({ where }, `{id, title}`);
		// 2. check if they own it or have the permissions
		//  TODO
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
		return { message: "Thanks" };
		// 3. Email the user the reset token
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
		const updatedUser = await ctx.db.mutation.updateUser({
			where: {
				email: user.email
			},
			data: {
				password,
				resetToken: null,
				resetTokenExpiry: null
			}
		});
		// 5. Generate jwt
		const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
		// 6. set the JWT to cookies
		ctx.response.cookie("token", token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // One year
		});
		// 7. return new user
		return user;
	}
};

module.exports = Mutations;
