const express = require('express');
const Document = require('../models/Document');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Получить список документов (с фильтрами)
router.get('/', async (req, res) => {
  try {
    const docs = await Document.findAll(req.query);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения документов' });
  }
});

// Получить один документ
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать документ
router.post('/', async (req, res) => {
  try {
    const { topic, type, content } = req.body;
    if (!topic || !type) {
      return res.status(400).json({ error: 'Тема и тип обязательны' });
    }
    const doc = await Document.create({
      topic,
      type,
      content: content || '',
      author_id: req.user.id,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания документа' });
  }
});

// Обновить документ (только автор или админ)
router.put('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });

    // Проверка прав: только автор или админ
    if (doc.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    const allowed = ['topic', 'type', 'status', 'content'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await Document.update(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// Удалить документ (только автор или админ)
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Документ не найден' });

    if (doc.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    await Document.delete(req.params.id);
    res.json({ message: 'Документ удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;