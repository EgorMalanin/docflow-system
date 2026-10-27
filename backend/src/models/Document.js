const { pool } = require('../config/db');

class Document {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        number VARCHAR(50) UNIQUE NOT NULL,
        topic VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('incoming', 'outgoing', 'internal')),
        status VARCHAR(30) NOT NULL DEFAULT 'draft' 
          CHECK (status IN ('draft', 'on_review', 'approved', 'rejected')),
        content TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
  }

  static async generateNumber() {
    const prefix = 'DOC';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${rand}`;
  }

  static async create({ topic, type, content, author_id }) {
    const number = await this.generateNumber();
    const res = await pool.query(
      `INSERT INTO documents (number, topic, type, content, author_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [number, topic, type, content, author_id]
    );
    return res.rows[0];
  }

  static async findAll(filter = {}) {
    let query = 'SELECT d.*, u.email as author_email FROM documents d LEFT JOIN users u ON d.author_id = u.id';
    const params = [];
    const conditions = [];

    if (filter.type) {
      params.push(filter.type);
      conditions.push(`d.type = $${params.length}`);
    }
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`d.status = $${params.length}`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY d.created_at DESC';

    const res = await pool.query(query, params);
    return res.rows;
  }

  static async findById(id) {
    const res = await pool.query(
      'SELECT d.*, u.email as author_email FROM documents d LEFT JOIN users u ON d.author_id = u.id WHERE d.id = $1',
      [id]
    );
    return res.rows[0];
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const res = await pool.query(
      `UPDATE documents SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    return res.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    return true;
  }
}

module.exports = Document;