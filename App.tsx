import { JSX, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

import { getDBConnection } from './db/database';
import { updateUser, getGroup } from './db/crud';
import { viewSchedule } from './parse';


const buildDate = (schedule: string[][] | null, groupName): string => {
  const raw = schedule?.[3]?.[0];
  if (!raw || typeof raw !== 'string') return '';

  const months: Record<string, string> = {
    "янв": "01",
    "фев": "02",
    "мар": "03",
    "апр": "04",
    "мая": "05",
    "июн": "06",
    "июл": "07",
    "авг": "08",
    "сен": "09",
    "окт": "10",
    "ноя": "11",
    "дек": "12",
  };

  // Пример строки: "Понедельник 6 мая 2024 (неделя 1)"
  const parts = raw.split(' ');
  if (parts.length < 4) return '';

  let dWeak = typeof raw === 'string' ? raw .split(' ') .slice(-1) .toString() .split('(')?.[1] ?.split(')')?.[0] ?.toLowerCase() ?? '' : '';
  const day = parts[1].padStart(2, '0');
  const month = months[parts[2].substring(0, 3)] ?? '??';
  const year = parts[3];
  dWeak = dWeak[0].toUpperCase() + dWeak.slice(1);
  

  return `${groupName.toUpperCase()}: ${dWeak} ${day}.${month}.${year}`;
};


const App = () => {
  const { width } = Dimensions.get('window');

  const timeSize = 0.3;
  const lessonSize = 0.45;
  const roomSize = 0.2;

  const [groupName, setGroupName] = useState('');
  const [inputText, setInputText] = useState('');
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleToday, setScheduleToday] = useState<string[][] | null>(null);
  const [scheduleTomorrow, setScheduleTomorrow] = useState<string[][] | null>(null);

  const schedule = day === 'today' ? scheduleToday : scheduleTomorrow;

  

  
  useEffect(() => {
    const init = async () => {
      try {
        const db = await getDBConnection();
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            groupName TEXT NOT NULL
          );
        `);
        const group = await getGroup(db);
        if (group?.groupName?.trim()) {
          setGroupName(group.groupName.trim());
        }
      } catch (error) {
        console.error('❌ Ошибка при инициализации:', error);
      }
    };
    init();
  }, []);

  
  useEffect(() => {
    const loadSchedule = async () => {
      if (!groupName.trim()) return;
      setLoadingSchedule(true);
      try {
        const [todayData, tomorrowData] = await Promise.all([
          viewSchedule(
            'https://www.vgtk.by/schedule/lessons/day-today.php',
            groupName.trim().toUpperCase()
          ),
          viewSchedule(
            'https://www.vgtk.by/schedule/lessons/day-tomorrow.php',
            groupName.trim().toUpperCase()
          ),
        ]);
        setScheduleToday(todayData);
        setScheduleTomorrow(tomorrowData);
      } catch (err) {
        console.error('❌ Ошибка загрузки расписания:', err);
        setScheduleToday(null);
        setScheduleTomorrow(null);
      } finally {
        setLoadingSchedule(false);
      }
    };
    loadSchedule();
  }, [groupName]);

  // const rawDate = schedule?.[3]?.[0];
  // const date =
  //   typeof rawDate === 'string'
  //     ? rawDate
  //         .split(' ')
  //         .slice(-1)
  //         .toString()
  //         .split('(')?.[1]
  //         ?.split(')')?.[0]
  //         ?.toLowerCase() ?? ''
  //     : '';

  const groupLabel = buildDate(schedule, groupName);

  const mergedRows: { time: string; lesson: string; room: string; rowspan: number }[] = [];

  if (
    Array.isArray(schedule) &&
    Array.isArray(schedule[0]) &&
    Array.isArray(schedule[1]) &&
    Array.isArray(schedule[2])
  ) {
    for (let i = 0; i < schedule[0].length; i++) {
      const time = schedule[0][i];
      const lesson = schedule[1][i + 1];
      const room = schedule[2][i + 1];
      const prev = mergedRows[mergedRows.length - 1];
      if (prev && prev.lesson === lesson && prev.room === room) {
        prev.rowspan += 1;
      } else {
        mergedRows.push({ time, lesson, room, rowspan: 1 });
      }
    }
  }

  const rows: JSX.Element[] = [];
  let index = 0;
  for (let i = 0; i < mergedRows.length; i++) {
    const { time, lesson, room, rowspan } = mergedRows[i];
    for (let j = 0; j < rowspan; j++) {
      rows.push(
        <View style={styles.row} key={`${i}-${j}`}>
          <Text style={[styles.cellBase, { width: width * timeSize }]}>
            {schedule?.[0]?.[index] ?? ''}
          </Text>
          {j === 0 && (
            <>
              <Text
                style={[
                  styles.cellBase,
                  {
                    width: width * lessonSize,
                    height: 30 * rowspan,
                    textAlignVertical: 'center',
                  },
                ]}
              >
                {lesson}
              </Text>
              <Text
                style={[
                  styles.cellBase,
                  {
                    width: width * roomSize,
                    height: 30 * rowspan,
                    textAlignVertical: 'center',
                  },
                ]}
              >
                {room}
              </Text>
            </>
          )}
        </View>
      );
      index++;
    }
  }

  const swipeGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationX < -50) setDay('tomorrow');
    else if (event.translationX > 50) setDay('today');
  });

  return (
    
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>
          {groupName.trim() === '' ? (
            <SafeAreaView style={styles.container}>
              <Text style={styles.heading}>Введите название группы ниже 👇</Text>
            </SafeAreaView>
          ) : (
            <SafeAreaView style={styles.container}>
              <Text style={[styles.heading, { fontFamily: 'SpaceMono' }]}>
                {groupLabel}
                
              </Text>

              <View style={styles.table}>
                <View style={styles.row}>
                  <Text style={[styles.cellBase, { width: width * timeSize }]}>Время</Text>
                  <Text style={[styles.cellBase, { width: width * lessonSize }]}>Предмет</Text>
                  <Text style={[styles.cellBase, { width: width * roomSize }]}>Кабинет</Text>
                </View>

                {loadingSchedule ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loaderText}>Загружаем расписание...</Text>
                  </View>
                ) : (
                  rows
                )}
              </View>
            </SafeAreaView>
          )}

          <SafeAreaView style={styles.bottomContainer}>
            <SafeAreaView style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Введите название группы"
                placeholderTextColor="#cdccccff"
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="done"
                onSubmitEditing={async () => {
                  const trimmed = inputText.trim();
                  if (!trimmed) return;
                  setGroupName(trimmed);
                  setInputText('');
                  const db = await getDBConnection();
                  await updateUser(db, trimmed);
                }}
              />
            </SafeAreaView>
          </SafeAreaView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121524',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  heading: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#7a7a7aff',
  },
  row: {
    flexDirection: 'row',
    height: 30,
  },
  cellBase: {
    padding: 1,
    borderWidth: 1,
    borderColor: '#979797ff',
    color: '#b1afafff',
    textAlign: 'center',
  },
  input: {
    color: '#ffffff',
    fontSize: 14,
    padding: 10,
    height: 40,
    width: 250,
  },
  inputContainer: {
    flex: 0,
    justifyContent: 'center',
    backgroundColor: '#020a06ff',
    position: 'absolute',
    right: 10,
    left: 10,
    bottom: 5,
    top: 5,
    borderRadius: 30,
  },
  bottomContainer: {
    flex: 0,
    backgroundColor: '#406a5bff',
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    height: 60,
    borderRadius: 20,
  },
  loaderContainer: {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 20,
},

loaderText: {
  marginTop: 10,
  fontSize: 16,
  color: '#ffffff',
  fontWeight: '500',
},

});

export default App;
