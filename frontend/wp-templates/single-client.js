import FrontPageTemplate from "./front-page";

export default function ClientTemplate(props) {
	return <FrontPageTemplate {...props} />;
}

ClientTemplate.query = FrontPageTemplate.query;