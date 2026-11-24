export const DEFAULT_JOB_TITLE = "Design engineer";

export function getJobTitleOverride(value) {
	if (typeof value !== "string") return null;
	const title = value.trim().replace(/\s+/g, " ");
	return title && title.length <= 80 ? title : null;
}

export function resolveJobTitle(value) {
	return getJobTitleOverride(value) || DEFAULT_JOB_TITLE;
}
