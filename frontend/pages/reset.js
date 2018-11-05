import Reset from "../components/Reset";

const Sell = props => (
	<div>
		<Reset resetToken={props.query.resetToken} />
		<p> Reset password {props.query.resetToken}</p>
	</div>
);

export default Sell;
