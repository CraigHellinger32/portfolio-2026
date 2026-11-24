import { Html, Head, Main, NextScript } from "next/document";
import { getTheme } from "../hooks/useDarkMode";

const themeInitialization = `document.documentElement.dataset.theme = (${getTheme.toString()})() ? "dark" : "light";`;

export default function Document() {
	return (
		<Html lang="en" suppressHydrationWarning>
			<Head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kedebideri&family=Share:wght@400;700&display=swap" />
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