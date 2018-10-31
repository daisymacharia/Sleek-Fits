import Signup from "../components/Signup";
import Signin from "../components/Signin";

import styled from "styled-components";

const Columns = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	grid-gap: 15px;
`;

const SignupPage = props => (
	<Columns>
		<Signup />
		<Signin />
	</Columns>
);

export default SignupPage;
