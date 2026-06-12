import { sql } from '@vercel/postgres';
import axios from 'axios';
import * as cheerio from 'cheerio';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Неверный токен' });
    }

    const { url, format } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL обязателен' });
    }

    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(response.data);

    const data = {
      url: url,
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      headings: {
        h1: $('h1').map((i, el) => $(el).text().trim()).get(),
        h2: $('h2').map((i, el) => $(el).text().trim()).get()
      },
      links: $('a').map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href')
      })).get().filter(link => link.text && link.href).slice(0, 20)
    };

    await sql`
      INSERT INTO conversions (user_id, url, format, result, created_at)
      VALUES (${userId}, ${url}, ${format}, ${JSON.stringify(data)}, NOW())
    `;

    if (format === 'json') {
      return res.status(200).json(data);
    } else if (format === 'csv') {
      let csv = 'Type,Content,Href\n';
      data.headings.h1.forEach(h => { csv += `H1,"${h.replace(/"/g, '""')}",\n`; });
      data.links.forEach(l => { csv += `Link,"${l.text.replace(/"/g, '""')}","${l.href}"\n`; });
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).send(csv);
    } else if (format === 'xml') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<website>\n';
      xml += `  <title>${data.title}</title>\n`;
      data.links.forEach(l => { xml += `    <link href="${l.href}">${l.text}</link>\n`; });
      xml += `</website>`;
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(xml);
    }

  } catch (error) {
    console.error('Convert error:', error);
    return res.status(500).json({ error: 'Не удалось получить данные сайта' });
  }
}