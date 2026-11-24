import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";
import { FaustProvider } from "@faustwp/core";
import { getTheme, subscribeTheme } from "../hooks/useDarkMode";
import ImageUnlockProvider from "../components/ImageUnlock/ImageUnlockProvider";
import { resolveJobTitle } from "../lib/jobTitle.mjs";
import "../faust.config";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
	const router = useRouter();
	const jobTitle = resolveJobTitle(router.query.title);

	useEffect(() => {
		const updateTheme = () => {
			document.documentElement.dataset.theme = getTheme() ? "dark" : "light";
		};
		updateTheme();
		return subscribeTheme(updateTheme);
	}, []);

	return (
		<FaustProvider pageProps={pageProps}>
			<Head>
				<title>Craig Hellinger | {jobTitle}</title>
			</Head>
			<ImageUnlockProvider>
				<Component {...pageProps} key={pageProps.__SEED_NODE__?.uri || router.pathname} />
			</ImageUnlockProvider>
		</FaustProvider>
	);
}