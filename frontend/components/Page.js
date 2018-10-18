import React, { Component } from "react";
import styled, { ThemeProvider, injectGlobal } from "styled-components";
import Header from "./Header";
import Meta from "./Meta";

const theme = {
	red: "#FF0000",
	black: "#393939",
	grey: "#3A3A3A",
	lightGrey: "#E1E1E1",
	offWhite: "#EDEDED",
	maxWidth: "70rem",
	bs: "0 12px 24px 0 rgba(0, 0, 0, 0.09)"
};

const StyledPage = styled.div`
	background: white;
	color: ${props => props.theme.black};
`;

const InnerPage = styled.div`
	max-width: ${props => props.theme.maxWidth};
	margin: 0 auto;
	padding: 2rem;
`;

injectGlobal`
	@font-face {
		font-family: 'radnika-next';
		src: url("./static/radnikanext-medium-webfont.woff2");
		format("woof2");
		font-weight: normal;
		font-style: normal;
	}

	html {
		box-sizing: border-box;
		font-style: 10px;

		*, *:before, *:after {
			box-sizing: inherit;
		}

		body {
			padding: 0;
			margin: 0;
			font-size: 1.5rem;
			line-height: 2;
			font-family: 'radnika-next'
		}

		a {
			text-decoration: none;
			color: ${theme.black};
	}
`;

class Page extends Component {
	render() {
		return (
			<ThemeProvider theme={theme}>
				<StyledPage>
					<Meta />
					<Header />
					<InnerPage>{this.props.children}</InnerPage>
				</StyledPage>
			</ThemeProvider>
		);
	}
}

export default Page;
