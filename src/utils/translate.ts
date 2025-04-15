import { translate } from "google-translate-api-x";
import type { Result } from "../lib/db";

export interface Translation {
	itemId: number;
	text: string;
	language: string;
}

/**
 * Translates text values to multiple languages
 * @param values The items to translate
 * @param languageOptions Target languages codes
 * @param defaultLanguage Source language code
 * @returns Array of translated items
 */
export async function translateText(
	values: Result[],
	languagesToTranslate: string[],
	defaultLanguage = "en",
): Promise<Translation[]> {
	if (!values.length || !languagesToTranslate.length) {
		return [];
	}

	try {
		const textsToTranslate = values.map((value) => value.name);

		const translationPromises = languagesToTranslate.map(async (language) => {
			try {
				const translations = await translate(textsToTranslate, {
					from: defaultLanguage,
					to: language,
					forceTo: true,
					autoCorrect: true,
				});

				return translations.map((translation, index) => ({
					itemId: values[index].id,
					text: translation.text,
					language,
				}));
			} catch (error) {
				console.error(`Translation error for language ${language}:`, error);
				return values.map((value) => ({
					itemId: value.id,
					text: value.name,
					language,
				}));
			}
		});

		const translationResults = await Promise.all(translationPromises);

		return translationResults.flat();
	} catch (error) {
		console.error("Translation failed:", error);
		throw new Error(`Failed to translate texts: ${error.message}`);
	}
}
