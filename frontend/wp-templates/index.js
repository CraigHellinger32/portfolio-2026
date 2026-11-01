import dynamic from "next/dynamic";
import frontPage from "./front-page.js";
import caseStudy from "./single-case_study.js";
const single = dynamic(() => import("./single.js"));
const page = dynamic(() => import("./page.js"));

export default {
	single,
	page,
    "single-case_study": caseStudy,
    "front-page": frontPage
};