import dynamic from "next/dynamic";
import frontPage from "./front-page.js";
const single = dynamic(() => import("./single.js"));
const page = dynamic(() => import("./page.js"));

export default {
	single,
	page,
    "front-page": frontPage
};