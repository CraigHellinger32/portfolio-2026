import Image from "next/image";
import parse, { attributesToProps, domToReact } from "html-react-parser";
import { useImageUnlock } from "../ImageUnlock/ImageUnlockProvider";
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
	const { unlocked, requestUnlock } = useImageUnlock();
	const unlock = onUnlock || requestUnlock;
	const options = {
		replace(node) {
			if (node.type !== "tag") return;
			if (unlocked) {
				if (node.name === "picture" && findRedactedImage(node)) {
					return <>{domToReact(node.children.filter((child) => child.type !== "tag" || child.name !== "source"), options)}</>;
				}
				if (node.name === "img" && node.attribs["data-pf2026-blurred"] === "true") {
					const attributes = { ...node.attribs };
					const source = attributes["data-pf2026-original-src"];
					delete attributes["data-pf2026-blurred"];
					delete attributes["data-pf2026-original-src"];
					delete attributes.srcset;
					delete attributes.sizes;
					const props = attributesToProps(attributes);
					const width = Number(attributes.width);
					const height = Number(attributes.height);
					if (source && width > 0 && height > 0) {
						return <Image {...props} src={source} alt={attributes.alt || ""} width={width} height={height} sizes="(max-width: 767px) calc(100vw - 40px), 1280px" />;
					}
					attributes.src = source || attributes.src;
					return domToReact([{ ...node, attribs: attributes }]);
				}
				return;
			}
			if (node.name === "a" || node.name === "button") {
				const image = findRedactedImage(node);
				if (image) {
					return (
						<RedactedImageButton alt={image.attribs.alt} onUnlock={unlock}>
							{domToReact(node.children)}
						</RedactedImageButton>
					);
				}
			}
			if (node.name === "picture") {
				const image = findRedactedImage(node);
				if (image) {
					return (
						<RedactedImageButton alt={image.attribs.alt} onUnlock={unlock}>
							{domToReact([node])}
						</RedactedImageButton>
					);
				}
			}
			if (node.name === "img" && node.attribs["data-pf2026-blurred"] === "true") {
				return (
					<RedactedImageButton alt={node.attribs.alt} onUnlock={unlock}>
						{domToReact([node])}
					</RedactedImageButton>
				);
			}
		},
	};

	return parse(html || "", options);
}
