import React, { Component } from "react";
import { Mutation, Query } from "react-apollo";
import Form from "./styles/Form";
import gql from "graphql-tag";
import Router from "next/router";

import formatMoney from "../lib/formatMoney";
import Error from "./ErrorMessage";

const SINGLE_ITEM_QUERY = gql`
	query SINGLE_ITEM_QUERY($id: ID!) {
		item(where: { id: $id }) {
			id
			title
			price
			description
		}
	}
`;

const UPDATE_ITEM_MUATATION = gql`
	mutation UPDATE_ITEM_MUATATION(
		$id: ID!
		$title: String
		$description: String
		$price: Int
	) {
		updateItem(
			id: $id
			title: $title
			description: $description
			price: $price
		) {
			id
			title
			price
			description
		}
	}
`;

class UpdateItem extends Component {
	state = {};

	handleChange = e => {
		const { name, value, type } = e.target;
		const val = type === "number" ? parseFloat(value) : value;
		this.setState({ [name]: val });
	};

	updateItem = async (e, updateItemMutation) => {
		e.preventDefault();
		console.log("updating item");
		const res = await updateItemMutation({
			variables: {
				id: this.props.id,
				...this.state
			}
		});
		console.log("updated!!");
	};

	render() {
		return (
			<Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
				{({ data, loading }) => {
					if (!data.item) return <p> No item found for id {this.props.id}</p>;
					if (loading) return <p> Loading...</p>;
					return (
						<Mutation mutation={UPDATE_ITEM_MUATATION} variables={this.state}>
							{(updateItem, { loading, error }) => (
								<Form
									onSubmit={e => {
										this.updateItem(e, updateItem);
									}}
								>
									<Error error={error} />
									<fieldset disabled={loading} aria-busy={loading}>
										<label htmlFor="title">
											Title
											<input
												type="text"
												id="title"
												name="title"
												placeholder="Title"
												required
												defaultValue={data.item.title}
												onChange={this.handleChange}
											/>
										</label>
										<label htmlFor="price">
											Price
											<input
												type="number"
												id="price"
												name="price"
												placeholder="Price"
												required
												defaultValue={data.item.price}
												onChange={this.handleChange}
											/>
										</label>
										<label htmlFor="description">
											Description
											<textarea
												type="text"
												id="description"
												name="description"
												placeholder="Enter A Description"
												required
												defaultValue={data.item.description}
												onChange={this.handleChange}
											/>
										</label>
										<button>Sav{loading ? "ing" : "e"} Changes</button>
									</fieldset>
								</Form>
							)}
						</Mutation>
					);
				}}
			</Query>
		);
	}
}

export default UpdateItem;
export { UPDATE_ITEM_MUATATION };
