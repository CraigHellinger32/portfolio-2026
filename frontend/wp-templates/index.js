import dynamic from "next/dynamic";

const single = dynamic(() => import("./single.js"));
const page = dynamic(() => import("./page.js"));

export default {
	single,
	page,
};