import { gql } from "@apollo/client";
import SingleTemplate from "./single";

export default function SkillTemplate(props) {
	return <SingleTemplate {...props} />;
}

SkillTemplate.query = gql`
	query GetSkill($uri: ID!) {
		post: skill(id: $uri, idType: URI) {
			title
			content
		}
	}
`;

SkillTemplate.variables = SingleTemplate.variables;