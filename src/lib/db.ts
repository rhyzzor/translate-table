import "dotenv/config";
import consola from "consola";
import postgres from "postgres";
import type { Translation } from "../utils/translate";

export interface Result {
	id: number;
	name: string;
}

export async function getTableAndValues(tableName: string): Promise<Result[]> {
	const sql = postgres(process.env.DATABASE_URL);

	try {
		const items = await sql<Result[]>`SELECT * FROM ${sql(tableName)} ORDER BY id`;

		return items;
	} catch (error) {
		consola.error("Error fetching data from database:", error);
		throw new Error(`Failed to fetch data from the database: ${error.message}`);
	} finally {
		await sql.end();
	}
}

export async function insertIntoDatabase(tableName: string, values: Translation[]) {
	const sql = postgres(process.env.DATABASE_URL, {
		transform: postgres.camel,
	});
	const newTableName = `${tableName}_translations_test`;

	try {
		const rows = await sql.begin(async (trx) => {
			await trx`
        CREATE TABLE IF NOT EXISTS ${trx(newTableName)} (
          id SERIAL PRIMARY KEY,
          item_id INTEGER NOT NULL REFERENCES ${sql(tableName)}(id),
          "language" TEXT NOT NULL,
          "text" TEXT NOT NULL
        )
      `;

			const insertedRows = await trx`
        INSERT INTO ${trx(newTableName)} ${trx(values)} RETURNING *
      `;

			return insertedRows;
		});

		consola.success(`Inserted ${rows.length} rows into ${newTableName}`);
	} catch (error) {
		consola.error("Error inserting data into database:", error);
		throw new Error(`Failed to insert data into the database: ${error.message}`);
	} finally {
		await sql.end();
	}
}
