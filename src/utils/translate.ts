import { translate } from "google-translate-api-x";
import type { Result } from "../lib/db";

/**
 * Represents a translation of a database item
 */
export interface Translation {
	itemId: number; // ID of the item in the database
	text: string; // Translated text
	language: string; // Language code (e.g. 'en', 'es', 'pt-BR')
}

/**
 * Translates text values to multiple languages using Google Translate API
 *
 * @param values - The items with ID and name to be translated
 * @param languagesToTranslate - Target language codes (e.g. ['en', 'es'])
 * @param defaultLanguage - Source language code (default: 'en')
 * @returns Promise with array of translations
 */
export async function translateText(
	values: Result[],
	languagesToTranslate: string[],
	defaultLanguage = "en",
): Promise<Translation[]> {
	// Check if there's data to translate
	if (!values.length || !languagesToTranslate.length) {
		return [];
	}

	try {
		// Extract only the names for translation
		const textsToTranslate = values.map((value) => value.name);

		// Create an array of promises to translate for each language
		const translationPromises = languagesToTranslate.map(async (language) => {
			try {
				// Translate all texts for current language
				const translations = await translate(textsToTranslate, {
					from: defaultLanguage,
					to: language,
					forceTo: true,
					autoCorrect: true,
				});

				// Map results to output format
				return translations.map((translation, index) => ({
					itemId: values[index].id,
					text: translation.text,
					language,
				}));
			} catch (error) {
				// Log error for specific language and return original text
				console.error(`Translation error for language ${language}:`, error);
				return values.map((value) => ({
					itemId: value.id,
					text: value.name, // Keep original text in case of error
					language,
				}));
			}
		});

		// Wait for all translations and combine results
		const translationResults = await Promise.all(translationPromises);
		return translationResults.flat();
	} catch (error) {
		console.error("Translation failed:", error);
		throw new Error(`Failed to translate texts: ${error.message}`);
	}
}
