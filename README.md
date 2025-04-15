# translate-table

A powerful CLI tool for translating PostgreSQL table content to multiple languages and generating translations for internationalization (i18n).

[![NPM Version](https://img.shields.io/npm/v/translate-table.svg)](https://www.npmjs.com/package/translate-table)
![GitHub License](https://img.shields.io/github/license/rhyzzor/translate-table)

## Description

`translate-table` is a specialized tool designed to help developers quickly translate content stored in PostgreSQL databases. It can:

- Extract content from any PostgreSQL table
- Translate the content to multiple languages using Google Translate
- Store translations back to the database or generate SQL files
- Support various language combinations

Ideal for projects requiring multilingual support without manual translation of database content.

## Installation

### Global Installation (Recommended)

```bash
npm install -g translate-table
```

### Local Installation

```bash
npm install translate-table
```

## Prerequisites

- Node.js version 18 or higher
- A PostgreSQL database with content to translate
- Database connection credentials

## Usage

### Basic Command Structure

```bash
translate-table translate --url <database_url> --table <table_name> --original-language <language_code> [--sql]
```

### Command Arguments

| Argument | Description | Required | Default |
|----------|-------------|----------|---------|
| `--url` | Database connection URL | Yes | - |
| `--table` | The table to translate | Yes | - |
| `--original-language` | Language code of source text | Yes | - |
| `--sql` | Output SQL files instead of database insertion | No | `false` |

### Interactive Language Selection

After running the command, you'll be prompted to select target languages for translation:

```
? Select languages › Press <space> to select, <a> to toggle all, <i> to invert selection
❯ ◯ English (en)
  ◯ Spanish (es)
  ◯ Portuguese (pt)
  ◯ French (fr)
  ◯ German (de)
  ◯ Japanese (ja)
```
  
## Examples

### Translate a 'products' table to Spanish and English

```bash
translate-table translate --url postgres://username:password@hostname:port/database --table products --original-language pt
```

### Generate SQL files instead of direct database insertion

```bash
translate-table translate --url postgres://username:password@hostname:port/database --table products --original-language en --sql
```

## How It Works

1. **Database Connection**: The tool connects to your PostgreSQL database using the `--url` parameter provided in the command.

2. **Content Extraction**: It extracts data from the specified table, using the `id` and `name` columns.

3. **Translation Process**: The extracted text is sent to Google Translate API to translate to the selected languages.

4. **Output Options**:
   - **Database Insertion**: Creates a new `<table_name>_translations` table and inserts translations.
   - **SQL File Generation**: Creates SQL files with table creation and insert statements in the `./sql` directory.

## Important Notes

- **Table Structure**: The source table must have `id` and `name` columns. The `id` is used as a reference, and `name` contains the text to translate.

- **Translation Table**: A new table named `<original_table>_translations` will be created with the structure:
  ```sql
  CREATE TABLE IF NOT EXISTS <table>_translations (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES <table>(id),
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL
  )
  ```

- **Google Translate API**: The tool uses Google Translate service for translations, which works without an API key but may have rate limits.

- **Large Datasets**: For large tables, consider using the `--sql` option to review translations before inserting them into the database.

## Supported Languages

The tool supports all languages available in Google Translate. The default options in the interactive prompt are:

- English (en)
- Spanish (es)
- Portuguese (Brazil) (pt)
- French (fr)
- German (de)
- Japanese (ja)

For a complete list of language codes, visit: [Google Translate API Language Codes](https://github.com/AidanWelch/google-translate-api/blob/master/lib/languages.cjs)

## Error Handling

- If a translation fails for a specific language, the tool will log the error but continue with other languages.
- The original text will be preserved for any failed translations.
- All database operations are performed within transactions to ensure data integrity.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
