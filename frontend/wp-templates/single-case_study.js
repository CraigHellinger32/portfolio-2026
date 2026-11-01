import FrontPageTemplate from "./front-page";

export default function CaseStudyTemplate(props) {
	return <FrontPageTemplate {...props} />;
}

CaseStudyTemplate.query = FrontPageTemplate.query;