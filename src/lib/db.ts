import consola from "consola";
import postgres from "postgres";
import type { Translation } from "../utils/translate";

/**
 * Represents a database query result item
 */
export interface Result {
	id: number; // Item ID in database
	name: string; // Text/name to be translated
}

/**
 * Creates a database connection
 * @returns A Postgres connection instance
 */
function createDbConnection(url: string) {
	if (!url) {
		throw new Error("DATABASE_URL not defined in environment variables");
	}

	return postgres(url);
}

/**
 * Fetches all records from a specific table
 *
 * @param tableName - Name of the table to query
 * @returns Promise with array of results
 */
export async function getTableAndValues(url: string, tableName: string): Promise<Result[]> {
	if (!tableName) {
		throw new Error("Table name is required");
	}

	const sql = createDbConnection(url);

	try {
		// SQL query with safe table name via sql tagged template
		const items = await sql<Result[]>`
			SELECT id, name 
			FROM ${sql(tableName)} 
			ORDER BY id
		`;

		return items;
	} catch (error) {
		consola.error("Error fetching data from database:", error);
		throw new Error(`Failed to fetch data from database: ${error.message}`);
	} finally {
		// Close connection
		await sql.end();
	}
}

/**
 * Inserts translations into the database
 *
 * @param tableName - Base table name
 * @param values - Translations to be inserted
 */
export async function insertIntoDatabase(
	url: string,
	tableName: string,
	values: Translation[],
): Promise<void> {
	if (!tableName) {
		throw new Error("Table name is required");
	}

	if (!values.length) {
		consola.warn("No values to insert into database");
		return;
	}

	const sql = createDbConnection(url);
	const newTableName = `${tableName}_translations`;

	try {
		// Use transaction to ensure all operations are atomic
		const rows = await sql.begin(async (transaction) => {
			// Create table if it doesn't exist
			await transaction`
				CREATE TABLE IF NOT EXISTS ${transaction(newTableName)} (
					id SERIAL PRIMARY KEY,
					item_id INTEGER NOT NULL REFERENCES ${transaction(tableName)}(id),
					"language" TEXT NOT NULL,
					"text" TEXT NOT NULL
				)
			`;

			// Insert all values at once
			const insertedRows = await transaction`
				INSERT INTO ${transaction(newTableName)} ${transaction(
					values.map((v) => ({ item_id: v.itemId, language: v.language, text: v.text })),
				)} 
				RETURNING *
			`;

			return insertedRows;
		});

		consola.success(`Inserted ${rows.length} rows into ${newTableName}`);
	} catch (error) {
		consola.error("Error inserting data into database:", error);
		throw new Error(`Failed to insert data into database: ${error.message}`);
	} finally {
		// Always close the connection
		await sql.end();
	}
}
