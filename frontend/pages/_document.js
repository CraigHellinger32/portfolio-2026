import { Html, Head, Main, NextScript } from "next/document";
import { getTheme } from "../hooks/useDarkMode";

const themeInitialization = `document.documentElement.dataset.theme = (${getTheme.toString()})() ? "dark" : "light";`;

export default function Document() {
	return (
		<Html lang="en" suppressHydrationWarning>
			<Head>
				<link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
				<link rel="alternate icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" sizes="180x180" />
				<script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitialization }} />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}