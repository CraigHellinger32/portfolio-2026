import { useRouter } from "next/router";
import { FaustProvider } from "@faustwp/core";
import "../faust.config";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
	const router = useRouter();

	return (
		<FaustProvider pageProps={pageProps}>
			<Component {...pageProps} key={pageProps.__SEED_NODE__?.uri || router.pathname} />
		</FaustProvider>
	);
}