import Nav from "./Nav";
import Link from "next/link";
import styled from "styled-components";
import Router from "next/router";
import NProgress from "nprogress";

Router.onRouteChangeStart = () => {
	NProgress.start();
};
Router.onRouteChangeComplete = () => {
	NProgress.done();
};
Router.onRouteChangeError = () => {
	NProgress.done();
};

const Logo = styled.h1`
	font-size: 3rem;
	margin-left: 2rem;
	position: relative;
	transform: skew(-7deg);
	z-index: 2;

	a {
		padding: 0.5rem 1rem;
		background: ${props => props.theme.red};
		color: white;
		text-decoration: none;
		text-transform: uppercase;
	}
	@media (max-width: 1300px) {
		text-align: center;
		margin: 0;
	}
`;

const StyledHeader = styled.div`
	.bar {
		border-bottom: 10px solid ${props => props.theme.black};
		display: grid;
		grid-template-columns: auto 2fr;
		justify-content: space-between;
		align-items: stretch;

		@media (max-width: 1300px) {
			grid-template-columns: 1fr;
			justify-content: centre;
		}
	}

	.sub-bar {
		display: grid;
		grid-template-columns: 1fr auto;
		border-bottom: 1px solid ${props => props.theme.lightGrey};
	}
`;

const Header = ({}) => (
	<StyledHeader>
		<div className="bar">
			<Logo>
				<Link href="/">
					<a>Sick Fits</a>
				</Link>
			</Logo>
			<Nav />
		</div>

		<div className="sub-bar">
			<p>Search</p>
		</div>
		<div>Cart</div>
	</StyledHeader>
);

export default Header;
