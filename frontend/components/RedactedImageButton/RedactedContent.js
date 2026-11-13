import parse, { domToReact } from "html-react-parser";
import RedactedImageButton from "./RedactedImageButton";

function findRedactedImage(node) {
	if (node.type !== "tag") return null;
	if (node.name === "img" && node.attribs["data-pf2026-blurred"] === "true") return node;
	for (const child of node.children || []) {
		const image = findRedactedImage(child);
		if (image) return image;
	}
	return null;
}

export default function RedactedContent({ html, onUnlock }) {
	const options = {
		replace(node) {
			if (node.type !== "tag") return;
			if (node.name === "a" || node.name === "button") {
				const image = findRedactedImage(node);
				if (image) {
					return (
						<RedactedImageButton alt={image.attribs.alt} onUnlock={onUnlock}>
							{domToReact(node.children)}
						</RedactedImageButton>
					);
				}
			}
			if (node.name === "picture") {
				const image = findRedactedImage(node);
				if (image) {
					return (
						<RedactedImageButton alt={image.attribs.alt} onUnlock={onUnlock}>
							{domToReact([node])}
						</RedactedImageButton>
					);
				}
			}
			if (node.name === "img" && node.attribs["data-pf2026-blurred"] === "true") {
				return (
					<RedactedImageButton alt={node.attribs.alt} onUnlock={onUnlock}>
						{domToReact([node])}
					</RedactedImageButton>
				);
			}
		},
	};

	return parse(html || "", options);
}
