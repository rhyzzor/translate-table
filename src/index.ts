import { defineCommand, runMain } from "citty";
import consola from "consola";
import { getTableAndValues, insertIntoDatabase } from "./lib/db";
import { generateFiles } from "./utils/sql";
import { translateText } from "./utils/translate";

export const translateCommand = defineCommand({
	meta: {
		name: "translate",
		version: "0.0.1",
		description: "Translate tables in database to another languages",
	},
	args: {
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
		const selectedLanguages = (await consola.prompt("Deploy", {
			type: "multiselect",
			required: true,
			options: [
				{ label: "English", value: "en" },
				{ label: "Spanish", value: "es" },
				{ label: "Portuguese (Brazil)", value: "pt-BR" },
			],
		})) as unknown as string[];

		const { "original-language": originalLanguage, table, sql } = args;

		consola.start("Connecting to database...");
		const values = await getTableAndValues(table);

		if (!values.length) {
			consola.error(new Error(`No values found in table ${table}`));
			return;
		}

		consola.info("Received values from database!");

		consola.start(
			`Translating ${values.length} items from ${originalLanguage.toUpperCase()} to ${selectedLanguages.map((value) => value.toUpperCase()).join(", ")}`,
		);

		const translatedText = await translateText(
			values,
			selectedLanguages,
			originalLanguage.toLowerCase(),
		);

		consola.success("Translation completed!");

		if (sql) {
			generateFiles(table, translatedText);
			return;
		}

		consola.start("Inserting translated values into database...");
		await insertIntoDatabase(table, translatedText);
	},
});

runMain(translateCommand);
