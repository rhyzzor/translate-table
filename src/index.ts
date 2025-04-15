import { defineCommand, runMain } from "citty";
import consola from "consola";
import { getTableAndValues, insertIntoDatabase } from "./lib/db";
import { generateFiles } from "./utils/sql";
import { translateText } from "./utils/translate";

/**
 * Available languages for translation
 */
const AVAILABLE_LANGUAGES = [
	{ label: "English (en)", value: "en" },
	{ label: "Spanish (es)", value: "es" },
	{ label: "Portuguese (pt-BR)", value: "pt-BR" },
	{ label: "French (fr)", value: "fr" },
	{ label: "German (de)", value: "de" },
	{ label: "Japanese (ja)", value: "ja" },
];

/**
 * Gets table values and performs translation
 *
 * @param tableName - Table name
 * @param originalLanguage - Original language of the texts
 * @param targetLanguages - Languages to translate to
 * @returns A Promise with translation results
 */
async function processTranslation(
	url: string,
	tableName: string,
	originalLanguage: string,
	targetLanguages: string[],
) {
	// Fetch data from database
	consola.start("Connecting to database...");
	const values = await getTableAndValues(url, tableName);

	if (!values.length) {
		throw new Error(`No values found in table ${tableName}`);
	}
	consola.info(`Received ${values.length} records from database`);

	// Perform translation
	consola.start(
		`Translating ${values.length} items from ${originalLanguage.toUpperCase()} to ${targetLanguages
			.map((value) => value.toUpperCase())
			.join(", ")}`,
	);

	const translatedText = await translateText(
		values,
		targetLanguages,
		originalLanguage.toLowerCase(),
	);

	consola.success("Translation completed!");
	return translatedText;
}

/**
 * Main CLI command
 */
const translateCommand = defineCommand({
	meta: {
		name: "translate",
		version: "0.0.1",
		description: "Translate database tables to other languages",
	},
	args: {
		url: {
			type: "string",
			description: "Database connection URL",
			required: true,
		},
		table: {
			type: "string",
			description: "Table to translate",
			required: true,
		},
		"original-language": {
			type: "string",
			description:
				"Language of the text to translate. Put the language code (You can find the list of language codes in https://github.com/AidanWelch/google-translate-api/blob/master/lib/languages.cjs)",
			required: true,
		},
		sql: {
			type: "boolean",
			description: "Output SQL instead of database insertion. (default: false)",
			default: false,
		},
	},
	async run({ args }) {
		try {
			// Request language selection for translation
			const selectedLanguages = (await consola.prompt("Select languages", {
				type: "multiselect",
				required: true,
				options: AVAILABLE_LANGUAGES,
			})) as unknown as string[];

			if (!selectedLanguages.length) {
				consola.error("No languages selected. Operation canceled.");
				return;
			}

			const { "original-language": originalLanguage, table, sql, url } = args;

			// Process translation
			const translatedText = await processTranslation(
				url,
				table,
				originalLanguage,
				selectedLanguages,
			);

			// Save results (SQL or database)
			if (sql) {
				generateFiles(table, translatedText);
			} else {
				consola.start("Inserting translated values into database...");
				await insertIntoDatabase(url, table, translatedText);
			}
		} catch (error) {
			consola.error("Error during process:", error.message);
			process.exit(1);
		}
	},
});

// Run the main command
runMain(translateCommand);
