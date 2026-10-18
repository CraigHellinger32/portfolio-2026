import { gql } from "@apollo/client";

export default function PageTemplate(props) {
	const { title, content } = props.data.page;

	return (
		<>
			<h1>{title}</h1>
			<div dangerouslySetInnerHTML={{ __html: content }} />
		</>
	);
}

PageTemplate.query = gql`
	query GetPage($uri: ID!) {
		page(id: $uri, idType: URI) {
			title
			content
		}
	}
`;

PageTemplate.variables = (seedQuery, ctx) => {
	return {
		uri: seedQuery?.uri,
	};
};