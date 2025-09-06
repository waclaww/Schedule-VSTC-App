import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export const getDBConnection = async () => {
  try {
    const db = await SQLite.openDatabase({
      name: 'schedule.db',
      location: 'default',
    });
    console.log('✅ База данных подключена');
    return db;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    throw Error('Не удалось подключиться к базе данных');
  }
};
