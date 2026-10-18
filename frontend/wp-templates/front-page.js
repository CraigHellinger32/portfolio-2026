import Link from "next/link";
import { gql } from "@apollo/client";

export default function FrontPageTemplate(props) {
	const { title, description } = props.data.generalSettings;
	const posts = props.data.posts.nodes;

	return (
		<main>
			<h1>{title}</h1>
			<p>{description}</p>

			<h2>Latest posts</h2>
			{posts.length === 0 && <p>No posts yet.</p>}
			<ul>
				{posts.map((post) => (
					<li key={post.id}>
						<Link href={post.uri}>{post.title}</Link>
						<div dangerouslySetInnerHTML={{ __html: post.excerpt }} />
					</li>
				))}
			</ul>
		</main>
	);
}

FrontPageTemplate.query = gql`
	query GetFrontPage {
		generalSettings {
			title
			description
		}
		posts(first: 5) {
			nodes {
				id
				title
				uri
				excerpt
			}
		}
	}
`;