import { Html, Head, Main, NextScript } from "next/document";
import { getTheme } from "../hooks/useDarkMode";

const themeInitialization = `document.documentElement.dataset.theme = (${getTheme.toString()})() ? "dark" : "light";`;

export default function Document() {
	return (
		<Html lang="en" suppressHydrationWarning>
			<Head>
				<script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitialization }} />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}