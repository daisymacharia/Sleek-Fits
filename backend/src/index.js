require("dotenv").config({ path: "variables.env" });
const cookieParser = require("cookie-parser");
const createServer = require("./createServer");
const db = require("./db");
const jwt = require("jsonwebtoken");

const server = createServer();

server.express.use(cookieParser());

// decode the jwt to get the user Id on each request
server.express.use((req, res, next) => {
	const { token } = req.cookies;
	if (token) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET);
		// put the userId onto the request for future requests to access
		req.userId = userId;
	}
	next();
});

// Create a middleware that populates the user on each request
server.express.use(async (req, res, next) => {
	// if they are not logged in skip this
	if (!req.userId) return next();
	const user = await db.query.user(
		{ where: { id: req.userId } },
		"{id, email, name, permissions }"
	);
	req.user = user;
	next();
});

server.start(
	{
		cors: {
			credentials: true,
			origin: process.env.FRONTEND_URL
		}
	},
	deets => {
		console.log(`server is now running on port http://localhost:${deets.port}`);
	}
);
