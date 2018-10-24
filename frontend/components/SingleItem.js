import React, { Component } from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import Error from "./ErrorMessage";
import styled from "styled-components";
import Head from "next/head";

const SingleItemStyles = styled.div`
	max-width: 1000px;
	box-shadow: ${props => props.theme.bs};
	margin: 2rem auto;
	display: grid;
	grid-template-columns: 1fr;
	grid-auto-flow: column;
	min-height: 700px;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.details {
		margin: 1.5rem;
		font-size: 1.5rem;
	}
`;

const SINGLE_ITEM_QUERY = gql`
	query SINGLE_ITEM_QUERY($id: ID!) {
		item(where: { id: $id }) {
			id
			title
			description
			image
			largeImage
		}
	}
`;
class SingleItem extends Component {
	render() {
		return (
			<Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
				{({ data, loading, error }) => {
					if (error) return <Error error={error} />;
					if (loading) return <p>loading!!</p>;
					if (!data.item) return <p>No item found for that id</p>;
					return (
						<SingleItemStyles>
							<Head>
								<title>Sick Fits | {data.item.title}</title>
							</Head>
							<img src={data.item.largeImage} alt={data.item.title} />
							<div className="details">
								<h2>Viewing {data.item.title} </h2>
								<p>{data.item.description}</p>
							</div>
						</SingleItemStyles>
					);
				}}
			</Query>
		);
	}
}

export default SingleItem;
