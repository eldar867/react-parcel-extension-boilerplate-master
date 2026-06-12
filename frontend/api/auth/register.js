import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (email, password, created_at)
      VALUES (${email}, ${hashedPassword}, NOW())
      RETURNING id, email, created_at
    `;

    return res.status(201).json({ 
      message: 'Регистрация успешна',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}