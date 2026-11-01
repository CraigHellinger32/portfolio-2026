import { gql } from "@apollo/client";
import SingleTemplate from "./single";

export default function ClientTemplate(props) {
	return <SingleTemplate {...props} />;
}

ClientTemplate.query = gql`
	query GetClient($uri: ID!) {
		post: client(id: $uri, idType: URI) {
			title
			content
		}
	}
`;

ClientTemplate.variables = SingleTemplate.variables;