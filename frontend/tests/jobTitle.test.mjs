import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_JOB_TITLE, getJobTitleOverride, resolveJobTitle } from "../lib/jobTitle.mjs";

test("job title defaults when missing or invalid", () => {
	assert.equal(resolveJobTitle(undefined), DEFAULT_JOB_TITLE);
	assert.equal(resolveJobTitle(["Product designer"]), DEFAULT_JOB_TITLE);
	assert.equal(resolveJobTitle("   "), DEFAULT_JOB_TITLE);
	assert.equal(resolveJobTitle("x".repeat(81)), DEFAULT_JOB_TITLE);
});

test("job title trims and normalizes whitespace", () => {
	assert.equal(resolveJobTitle("  Product   designer \n"), "Product designer");
});

test("job title override is optional when no valid parameter is supplied", () => {
	assert.equal(getJobTitleOverride(undefined), null);
	assert.equal(getJobTitleOverride("   "), null);
	assert.equal(getJobTitleOverride("Product designer"), "Product designer");
});
