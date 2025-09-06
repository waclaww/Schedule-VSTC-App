import { SQLiteDatabase } from 'react-native-sqlite-storage';
export async function updateUser(db: SQLiteDatabase, group: string): Promise<void> {
  const result = await db.executeSql('SELECT COUNT(*) as count FROM user;');
  const count = result[0].rows.item(0).count;

  if (count === 0) {
    await db.executeSql('INSERT INTO user (groupName) VALUES (?);', [group]);
  } else {
    await db.executeSql('UPDATE user SET groupName = ?;', [group]);
  }
}


export const insertSchedule = async (db: SQLiteDatabase, date: string, schedule: string): Promise<void> => {
  await db.executeSql('INSERT INTO dates (date, schedule) VALUES (?, ?);', [date, schedule]);
};

export const getGroup = async (
    db: SQLiteDatabase
    ): Promise<{
      groupName: string }  | null> => {
    try {
        const results = await db.executeSql('SELECT groupName FROM user;');
        const result = results[0];

        if (result.rows.length > 0) {
        return result.rows.item(0); // возвращаем первую строку
        }

        return null;
    } catch (error) {
        console.error('Ошибка при получении группы:', error);
        return null;
    }
    };


export const getScheduleStep = async (
  db: SQLiteDatabase,
  id: number
): Promise<{ schedule: string; date: string } | null> => {
  try {
    const results = await db.executeSql(
      'SELECT schedule, date FROM user WHERE id = ?;',
      [id - 1]
    );

    const result = results[0];
    if (result.rows.length > 0) {
      return result.rows.item(0); 
    } else {
      return null;
    }
  } catch (error) {
    console.error('Ошибка при получении строки:', error);
    return null;
  }
};

export const getScheduleDate = async (
  db: SQLiteDatabase,
  date: string
): Promise<{ schedule: string; date: string } | null> => {
  try {
    const results = await db.executeSql(
      'SELECT schedule, date FROM user WHERE date = ?;',
      [date]
    );

    const result = results[0];
    if (result.rows.length > 0) {
      return result.rows.item(0); 
    } else {
      return null; 
    }
  } catch (error) {
    console.error('Ошибка при получении строки:', error);
    return null;
  }
};

