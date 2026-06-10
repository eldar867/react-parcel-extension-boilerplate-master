const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/convert', async (req, res) => {
  try {
    const { url, format } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL обязателен' });
    }

    // Парсим сайт
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Извлекаем данные
    const data = {
      url: url,
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      headings: {
        h1: $('h1').map((i, el) => $(el).text().trim()).get(),
        h2: $('h2').map((i, el) => $(el).text().trim()).get(),
        h3: $('h3').map((i, el) => $(el).text().trim()).get()
      },
      links: $('a').map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href')
      })).get().filter(link => link.text && link.href),
      images: $('img').map((i, el) => ({
        src: $(el).attr('src'),
        alt: $(el).attr('alt') || ''
      })).get().filter(img => img.src),
      metaTags: {}
    };

    // Собираем все meta теги
    $('meta').each((i, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const content = $(el).attr('content');
      if (name && content) {
        data.metaTags[name] = content;
      }
    });

    // Конвертируем в нужный формат
    if (format === 'json') {
      res.json(data);
    } else if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } else if (format === 'xml') {
      const xml = convertToXML(data);
      res.setHeader('Content-Type', 'application/xml');
      res.send(xml);
    } else {
      res.status(400).json({ error: 'Неподдерживаемый формат' });
    }

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Не удалось получить данные сайта. Проверьте URL.' 
    });
  }
});

// Конвертация в CSV
function convertToCSV(data) {
  let csv = 'Type,Content\n';
  
  // Заголовки
  data.headings.h1.forEach(h => {
    csv += `H1,"${h.replace(/"/g, '""')}"\n`;
  });
  data.headings.h2.forEach(h => {
    csv += `H2,"${h.replace(/"/g, '""')}"\n`;
  });
  
  // Ссылки
  data.links.forEach(link => {
    csv += `Link,"${link.text.replace(/"/g, '""')}",${link.href}\n`;
  });
  
  return csv;
}

// Конвертация в XML
function convertToXML(data) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<website>\n`;
  xml += `  <url>${data.url}</url>\n`;
  xml += `  <title>${escapeXml(data.title)}</title>\n`;
  xml += `  <description>${escapeXml(data.description)}</description>\n`;
  
  xml += `  <headings>\n`;
  data.headings.h1.forEach(h => {
    xml += `    <h1>${escapeXml(h)}</h1>\n`;
  });
  data.headings.h2.forEach(h => {
    xml += `    <h2>${escapeXml(h)}</h2>\n`;
  });
  xml += `  </headings>\n`;
  
  xml += `  <links>\n`;
  data.links.slice(0, 20).forEach(link => {
    xml += `    <link text="${escapeXml(link.text)}">${escapeXml(link.href)}</link>\n`;
  });
  xml += `  </links>\n`;
  
  xml += `</website>`;
  return xml;
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});