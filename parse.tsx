import axios from 'axios';
import cheerio from 'react-native-cheerio';

export async function viewSchedule(url: string, group: string): Promise<string[][]> {
  try {
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);

    const table = $('table').first();
    const rows = table.find('tr');

    const matrix: any[][] = [];
    let y = 0;

    rows.each((_: any, rowEl: any) => {
      const cells = $(rowEl).find('td');
      let x = 0;

      cells.each((_: any, cellEl: any) => {
        const cell = $(cellEl);
        const rowspan = parseInt(cell.attr('rowspan') || '1', 10);
        const colspan = parseInt(cell.attr('colspan') || '1', 10);

        while (matrix[y] && matrix[y][x]) x++;

        for (let dy = 0; dy < rowspan; dy++) {
          const rowY = y + dy;
          if (!matrix[rowY]) matrix[rowY] = [];

          for (let dx = 0; dx < colspan; dx++) {
            matrix[rowY][x + dx] = cell;
          }
        }

        x += colspan;
      });

      y++;
    });

    // Ищем "ВР-21"
    let foundY = -1;
    let foundX = -1;

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y]?.length; x++) {
        const cell = matrix[y][x];
        if (cell?.text().trim() === group) {
          foundY = y;
          foundX = x;
          break;
        }
      }
      if (foundY !== -1) break;
    }

    const lessons: string[] = [];
    const rooms: string[] = [];
    const times: string[] = [];

    if (foundY === -1 || foundX === -1) {
      console.log('⛔ Группа ВР-21 не найдена');
    } else {
      for (let i = 0; i <= 10; i++) {
        const lessonCell = matrix[foundY + i]?.[foundX];
        const roomCell = matrix[foundY + i]?.[foundX + 1];
        const timeCell = matrix[3 + i][1];
        if (lessonCell) {
          lessons.push(lessonCell.text().trim());
          rooms.push(roomCell.text().trim());
          times.push(timeCell.text().trim());
        } else {
          console.log(`🕳️ Ячейка ${i} отсутствует`);
        }
      }
    }

    let date = matrix[0][0].text();

    return [times, lessons, rooms, [date]];
  } catch (err) {
    console.error('❌ Ошибка при загрузке расписания:', err);
    return [];
  }
}
