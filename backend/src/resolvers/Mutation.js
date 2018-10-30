const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
			throw new Error(`Invalid password !`);
		}
		// 3. generate jwt token
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// 4. set JWT as cookie on the response
		ctx.response.cookie("token", token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
		});
		return user;
	}
};

module.exports = Mutations;
