import fs from "node:fs";
import path from "node:path";
import consola from "consola";
import type { Translation } from "./translate";

/**
 * Generates SQL INSERT statement for translations
 *
 * @param tableName - Table name for insertion
 * @param values - Translation values to be inserted
 * @returns String containing SQL INSERT statement
 */
function generateInsert(tableName: string, values: Translation[]): string {
	// Escape strings to prevent SQL injection
	const escapeSQL = (text: string): string => {
		if (!text) return "";
		return text.replace(/'/g, "''");
	};

	// Create value clauses for each translation
	const inserts = values.map((value) => {
		return `(${value.itemId}, '${escapeSQL(value.language)}', '${escapeSQL(value.text)}')`;
	});

	return `INSERT INTO ${tableName} (item_id, "language", "text") VALUES ${inserts.join(", ")};`;
}

/**
 * Generates SQL files for table creation and translation insertion
 *
 * @param tableName - Base table name
 * @param values - Translated values to be inserted
 */
export function generateFiles(tableName: string, values: Translation[]): void {
	consola.info("Generating SQL files...");

	// Table name for translations
	const translationsTable = `${tableName}_translations`;

	// Generate SQL for insertion
	const rawInsertSQL = generateInsert(translationsTable, values);

	// Generate SQL for table creation
	const createTableSQL = `
  CREATE TABLE IF NOT EXISTS ${translationsTable} (
    id SERIAL PRIMARY KEY, 
    item_id INT NOT NULL REFERENCES ${tableName} (id), 
    "language" VARCHAR(10) NOT NULL, 
    "text" TEXT NOT NULL
  )`;

	// Output filename
	const sqlFileName = `${translationsTable}.sql`;

	// Split SQL instructions into lines for better readability
	const insertLines = rawInsertSQL.match(/.{1,400}/g) || [];
	const formattedInsertSQL = insertLines.join("\n");

	// Combine creation and insertion SQL
	const sqlFileContent = `${createTableSQL}\n\n${formattedInsertSQL}`;
	const sqlDirPath = "./sql";
	const sqlFilePath = path.join(sqlDirPath, sqlFileName);

	try {
		// Ensure directory exists
		if (!fs.existsSync(sqlDirPath)) {
			fs.mkdirSync(sqlDirPath, { recursive: true });
		}

		// Write SQL file
		fs.writeFileSync(sqlFilePath, sqlFileContent, "utf8");
		consola.success(`SQL file ${sqlFileName} generated successfully!`);
	} catch (error) {
		consola.error(`Error generating SQL file: ${error.message}`);
		throw new Error(`Failed to create SQL file: ${error.message}`);
	}
}
