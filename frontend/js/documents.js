const API = '/api';

function getToken() { 
  return localStorage.getItem('token'); 
}

function getUser() { 
  return JSON.parse(localStorage.getItem('user') || 'null'); 
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded сработал');
  
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    console.warn('Нет токена или пользователя, редирект на login');
    window.location.href = 'login.html';
    return;
  }

  // ⭐ ВАЖНО: показываем основной контент
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.style.display = 'block';
  }

  console.log('Инициализация интерфейса...');
  renderUserInfo();
  loadDocuments();
  setupEventListeners();
});

// Выход
function renderUserInfo() {
  const user = getUser();
  const info = document.getElementById('user-info');
  if (!info) return;
  
  info.innerHTML = `
    <span> ${user.email} (${user.role})</span>
    <button id="btn-logout">Выйти</button>
  `;
  
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
}

// Обработчик выхода
async function handleLogout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Загрузка списка документов
async function loadDocuments() {
  const token = getToken();
  if (!token) {
    console.error('No token found');
    window.location.href = 'login.html';
    return;
  }

  const list = document.getElementById('documents-list');
  if (!list) return;

  const type = document.getElementById('filter-type')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);

  try {
    const res = await fetch(`${API}/documents?${params}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (res.status === 401) {
      console.error('Unauthorized, redirecting to login');
      window.location.href = 'login.html';
      return;
    }
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const docs = await res.json();
    console.log('Loaded documents:', docs);
    renderDocuments(docs);
  } catch (err) {
    console.error('Error loading documents:', err);
    if (list) {
      list.innerHTML = `<p style="color:red;text-align:center;padding:2rem;">Ошибка загрузки: ${err.message}</p>`;
    }
  }
}

function renderDocuments(docs) {
  const list = document.getElementById('documents-list');
  if (!list) return;
  
  if (!docs || docs.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:2rem;">Документов не найдено. Нажмите "Новый документ" для создания.</p>';
    return;
  }

  const typeLabels = { 
    incoming: 'Входящий', 
    outgoing: 'Исходящий', 
    internal: 'Внутренний' 
  };
  
  const statusLabels = { 
    draft: 'Черновик', 
    on_review: 'На согласовании', 
    approved: 'Подписан', 
    rejected: 'Отклонён' 
  };
  
  const user = getUser();

  list.innerHTML = docs.map(d => `
    <div class="doc-card">
      <div class="doc-info">
        <h3>${d.topic || 'Без темы'}</h3>
        <div class="meta">
          № ${d.number || 'N/A'} · ${new Date(d.created_at).toLocaleString('ru-RU')} · Автор: ${d.author_email || '—'}
        </div>
        <div style="margin-top:0.5rem;">
          <span class="badge ${d.type}">${typeLabels[d.type] || d.type}</span>
          <span class="badge ${d.status}">${statusLabels[d.status] || d.status}</span>
        </div>
        ${d.content ? `<p style="margin-top:0.5rem;color:#555;">${d.content.substring(0, 200)}${d.content.length > 200 ? '...' : ''}</p>` : ''}
      </div>
      <div class="doc-actions">
        ${(d.author_id === user.id || user.role === 'admin') ? `
          <button class="btn-edit" onclick="editDoc(${d.id})">✏️</button>
          <button class="btn-delete" onclick="deleteDoc(${d.id})">🗑️</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Новый документ
  const btnNew = document.getElementById('btn-new');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      document.getElementById('form-title').textContent = 'Новый документ';
      document.getElementById('doc-form').reset();
      document.getElementById('doc-id').value = '';
      document.getElementById('doc-status').value = 'draft';
      document.getElementById('document-form').style.display = 'block';
    });
  }

  // Отмена
  const btnCancel = document.getElementById('btn-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      document.getElementById('document-form').style.display = 'none';
    });
  }

  // Сохранение документа
  const docForm = document.getElementById('doc-form');
  if (docForm) {
    docForm.addEventListener('submit', handleFormSubmit);
  }

  // Фильтры
  const filterType = document.getElementById('filter-type');
  const filterStatus = document.getElementById('filter-status');
  
  if (filterType) filterType.addEventListener('change', loadDocuments);
  if (filterStatus) filterStatus.addEventListener('change', loadDocuments);
}

// Обработчик отправки формы
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const token = getToken();
  if (!token) {
    alert('Ошибка авторизации. Войдите заново.');
    window.location.href = 'login.html';
    return;
  }
  
  const id = document.getElementById('doc-id').value;
  const payload = {
    topic: document.getElementById('doc-topic').value,
    type: document.getElementById('doc-type').value,
    status: document.getElementById('doc-status').value,
    content: document.getElementById('doc-content').value,
  };

  try {
    const url = id ? `${API}/documents/${id}` : `${API}/documents`;
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка сохранения');
    }

    document.getElementById('document-form').style.display = 'none';
    await loadDocuments();
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}

// Глобальные функции для кнопок редактирования/удаления
window.editDoc = async (id) => {
  const token = getToken();
  if (!token) {
    alert('Ошибка авторизации');
    return;
  }
  
  try {
    const res = await fetch(`${API}/documents/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!res.ok) throw new Error('Ошибка загрузки документа');
    
    const doc = await res.json();
    
    document.getElementById('form-title').textContent = 'Редактирование документа';
    document.getElementById('doc-id').value = doc.id;
    document.getElementById('doc-topic').value = doc.topic;
    document.getElementById('doc-type').value = doc.type;
    document.getElementById('doc-status').value = doc.status;
    document.getElementById('doc-content').value = doc.content || '';
    document.getElementById('document-form').style.display = 'block';
  } catch (err) {
    alert(err.message);
  }
};

window.deleteDoc = async (id) => {
  if (!confirm('Удалить документ?')) return;
  
  const token = getToken();
  if (!token) {
    alert('Ошибка авторизации');
    return;
  }
  
  try {
    const res = await fetch(`${API}/documents/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (res.ok) {
      await loadDocuments();
    } else {
      const data = await res.json();
      alert('Ошибка удаления: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
};

console.log('documents.js loaded');