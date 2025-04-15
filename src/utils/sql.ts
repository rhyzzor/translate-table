import fs from "node:fs";
import consola from "consola";
import type { Translation } from "./translate";

function generateInsert(tableName: string, values: Translation[]) {
	const inserts = values.map((value) => {
		return `(${value.itemId}, '${value.language}', '${value.text}')`;
	});

	return `INSERT INTO ${tableName} (item_id, "language", "text") VALUES ${inserts.join(", ")};`;
}

export function generateFiles(tableName: string, values: Translation[]) {
	consola.info("Generating SQL files...");

	const newTableName = `${tableName}_translations`;

	const rawInsertSQL = generateInsert(newTableName, values);

	const rawTableSQL = `
  CREATE TABLE IF NOT EXISTS ${newTableName} (
    id SERIAL PRIMARY KEY, 
    item_id INT NOT NULL REFERENCES ${tableName} (id), 
    "language" VARCHAR(10) NOT NULL, 
    "text" TEXT NOT NULL
  )`;

	const sqlFileName = `${newTableName}.sql`;

	const insertLines = rawInsertSQL.match(/.{1,400}/g) || [];
	const formattedInsertSQL = insertLines.join("\n");

	const sqlFileContent = `${rawTableSQL}\n\n${formattedInsertSQL}`;
	const sqlFilePath = `./sql/${sqlFileName}`;

	if (!fs.existsSync("./sql")) {
		fs.mkdirSync("./sql");
	}

	fs.writeFileSync(sqlFilePath, sqlFileContent, "utf8");
	consola.success(`SQL file ${sqlFileName} generated successfully!`);
}
