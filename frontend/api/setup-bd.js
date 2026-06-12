import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS conversions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        format VARCHAR(10) NOT NULL,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return res.status(200).json({ message: 'База данных создана' });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Ошибка создания БД' });
  }
}