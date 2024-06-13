import { describe, expect, it } from 'bun:test';
import { Glob } from 'bun';

import { parse } from '../mod';

const FIXTURES_PATH = './src/__tests__/__fixtures__/';
const gsdFixtureGlob = new Glob('*.txt');

const gsdFixtureFiles: string[] = [];

for await (const file of gsdFixtureGlob.scan(FIXTURES_PATH)) {
	gsdFixtureFiles.push(file);
}

const getFixtureText = async (file: string) => {
	const fixtureFile = Bun.file(`${FIXTURES_PATH}${file}`);
	return await fixtureFile.text();
};

describe('mod', () => {
	describe('parse', () => {
		it('throws an error if the input is not a string', () => {
			expect(() =>
				// @ts-ignore - intentionally passing invalid input for test
				parse(123),
			).toThrowError(TypeError);

			expect(() =>
				// @ts-ignore - intentionally passing invalid input for test
				parse(undefined),
			).toThrowError(TypeError);

			expect(() =>
				// @ts-ignore - intentionally passing invalid input for test
				parse(null),
			).toThrowError(TypeError);

			expect(() =>
				// @ts-ignore - intentionally passing invalid input for test
				parse(true),
			).toThrowError(TypeError);

			expect(() =>
				// @ts-ignore - intentionally passing invalid input for test
				parse({}),
			).toThrowError(TypeError);
		});

		it('throws expected error for empty string input', () => {
			expect(() => parse('')).toThrowError(
				'Failed to parse. Ensure the input is a valid GSD formatted string.',
			);
		});

		it('parses multiple reports', async () => {
			const fixtureText = await getFixtureText('sgu-rap-eighteen-hours.txt');

			const parsedReports = parse(fixtureText);

			expect(parsedReports).toHaveLength(18);
		});

		it.each(gsdFixtureFiles)(
			'parses fixture %s with expected snapshot',
			async (file) => {
				const fixtureText = await getFixtureText(file);

				const parsedReports = parse(fixtureText);

				expect(parsedReports).toMatchSnapshot(file);
			},
		);
	});
});
