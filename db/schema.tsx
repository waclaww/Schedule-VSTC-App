import { SQLiteDatabase } from "react-native-sqlite-storage";

export const createTables = async (db: SQLiteDatabase): Promise<void> => {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS user (
      groupName TEXT DEFAULT ''
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      schedule TEXT
    );
  `);

  // Проверка: есть ли уже строка в user
  const result = await db.executeSql('SELECT COUNT(*) as count FROM user;');
  const count = result[0].rows.item(0).count;

  if (count === 0) {
    await db.executeSql(`INSERT INTO user (groupName) VALUES ('Not group');`);
  }
};
