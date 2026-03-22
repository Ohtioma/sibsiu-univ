const Store = {
  _get(key) {
    try { return JSON.parse(localStorage.getItem('sib_' + key)); }
    catch(e) { return null; }
  },
  _set(key, val) { localStorage.setItem('sib_' + key, JSON.stringify(val)); },

  get surveys()   { return this._get('surveys')   || []; },
  set surveys(v)  { this._set('surveys', v); },

  get ankety()    { return this._get('ankety')    || []; },
  set ankety(v)   { this._set('ankety', v); },

  get programs()  { return this._get('programs')  || []; },
  set programs(v) { this._set('programs', v); },

  get responses() { return this._get('responses') || []; },
  set responses(v){ this._set('responses', v); },

  get seeded()    { return !!this._get('seeded'); },
  set seeded(v)   { this._set('seeded', v); },

  get adminLogin()     { return localStorage.getItem('sibgiu_admin_login') || 'admin'; },
  get adminPassword()  { return localStorage.getItem('sibgiu_admin_pass')  || 'admin'; },

  get accessTokens()   { try { return JSON.parse(localStorage.getItem('sibgiu_access_tokens') || '[]'); } catch(e) { return []; } },
  set accessTokens(v)  { localStorage.setItem('sibgiu_access_tokens', JSON.stringify(v)); },
};

function uid() { return '_' + Math.random().toString(36).substr(2, 9); }

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU');
}

function fmtDateRange(start, end) {
  const s = start ? new Date(start).toLocaleDateString('ru-RU') : '?';
  const e = end   ? new Date(end).toLocaleDateString('ru-RU')   : '?';
  return s + ' – ' + e;
}

function today() { return new Date().toISOString().slice(0,10); }

let _toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function seedData() {
  if (Store.seeded) return;

  const a1id = uid(), a2id = uid(), a3id = uid();
  const p1id = uid(), p2id = uid(), p3id = uid();
  const s1id = uid(), s2id = uid(), s3id = uid();

  Store.ankety = [
    {
      id: a1id,
      name: 'Удовлетворённость качеством образовательного процесса',
      dateModified: Date.now() - 86400000 * 2,
      questions: [
        { id: uid(), text: 'Как вы оцениваете общий уровень организации образовательного процесса?', description: '', type: 'radio', required: true,
          options: ['Отлично', 'Хорошо', 'Удовлетворительно', 'Неудовлетворительно'] },
        { id: uid(), text: 'Укажите дисциплины, вызвавшие наибольшие затруднения', description: 'Можно указать несколько', type: 'paragraph', required: false, options: [] },
        { id: uid(), text: 'Какие аспекты учебного процесса требуют улучшения?', description: '', type: 'checkbox', required: false,
          options: ['Расписание', 'Материально-техническая база', 'Методические материалы', 'Работа деканата', 'Взаимодействие с преподавателями'] },
        { id: uid(), text: 'Ваши дополнительные предложения и пожелания', description: 'Необязательно', type: 'paragraph', required: false, options: [] },
      ]
    },
    {
      id: a2id,
      name: 'Оценка преподавательского состава',
      dateModified: Date.now() - 86400000 * 5,
      questions: [
        { id: uid(), text: 'Оцените профессиональную компетентность преподавателей', description: '', type: 'radio', required: true,
          options: ['Очень высокая', 'Высокая', 'Средняя', 'Низкая'] },
        { id: uid(), text: 'Насколько преподаватели доступны для консультаций?', description: '', type: 'radio', required: true,
          options: ['Всегда доступны', 'Чаще всего доступны', 'Редко доступны', 'Недоступны'] },
        { id: uid(), text: 'Ваши комментарии о работе преподавательского состава', description: '', type: 'paragraph', required: false, options: [] },
      ]
    },
    {
      id: a3id,
      name: 'Материально-техническое оснащение',
      dateModified: Date.now() - 86400000 * 10,
      questions: [
        { id: uid(), text: 'Оцените состояние учебных аудиторий', description: '', type: 'radio', required: true,
          options: ['Отлично', 'Хорошо', 'Удовлетворительно', 'Плохо'] },
        { id: uid(), text: 'Какое оборудование требует замены или ремонта?', description: 'Укажите все необходимое', type: 'checkbox', required: false,
          options: ['Компьютеры', 'Проекторы', 'Мебель', 'Лабораторное оборудование', 'Интерактивные доски'] },
        { id: uid(), text: 'Оцените доступность Wi-Fi на территории вуза', description: '', type: 'radio', required: false,
          options: ['Отличная', 'Хорошая', 'Плохая', 'Отсутствует'] },
      ]
    },
  ];

  Store.programs = [
    { id: p1id, code: '09.03.01', name: 'Информатика и вычислительная техника', programName: 'Информационные системы и технологии', dateModified: Date.now() - 86400000 * 3 },
    { id: p2id, code: '09.03.04', name: 'Программная инженерия', programName: 'Разработка программного обеспечения', dateModified: Date.now() - 86400000 * 7 },
    { id: p3id, code: '38.03.01', name: 'Экономика', programName: 'Финансы и кредит', dateModified: Date.now() - 86400000 * 14 },
  ];

  Store.surveys = [
    {
      id: s1id,
      title: 'Опрос обучающихся об удовлетворённости условиями, содержанием и качеством образовательного процесса 2024/25',
      description: 'Ежегодный опрос обучающихся в целях мониторинга качества образовательного процесса и улучшения условий обучения в СибГИУ.',
      category: 'Обучающиеся',
      status: 'active',
      dateStart: '2024-09-01',
      dateEnd: '2025-01-31',
      anketaIds: [a1id, a3id],
      programIds: [p1id, p2id],
      groups: ['Студенты'],
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: s2id,
      title: 'Опрос преподавателей о качестве научно-методического обеспечения дисциплин',
      description: 'Оценка обеспеченности учебного процесса методическими материалами и научной литературой.',
      category: 'Преподаватели',
      status: 'completed',
      dateStart: '2024-01-15',
      dateEnd: '2024-06-15',
      anketaIds: [a2id],
      programIds: [p1id, p3id],
      groups: ['Преподаватели'],
      createdAt: Date.now() - 86400000 * 90,
    },
    {
      id: s3id,
      title: 'Оценка удовлетворённости материально-техническим оснащением',
      description: 'Черновик опроса по оценке состояния учебных помещений, оборудования и инфраструктуры.',
      category: 'Обучающиеся',
      status: 'draft',
      dateStart: '2025-02-01',
      dateEnd: '2025-05-01',
      anketaIds: [a3id],
      programIds: [p2id],
      groups: ['Студенты', 'Аспиранты'],
      createdAt: Date.now() - 86400000 * 5,
    },
  ];

  
  const anketa1 = Store.ankety[0];
  const respArr = [];
  const names = ['Иванов А.', 'Петрова М.', 'Сидоров Д.', 'Козлова Е.', 'Новиков П.', 'Смирнова О.', 'Волков К.'];
  const radAnswers = [['Отлично','Хорошо','Хорошо','Отлично','Хорошо','Удовлетворительно','Хорошо']];
  for (let i = 0; i < 7; i++) {
    const answers = {};
    anketa1.questions.forEach((q, qi) => {
      if (q.type === 'radio') answers[q.id] = q.options[i % q.options.length];
      else if (q.type === 'checkbox') answers[q.id] = [q.options[0], q.options[i % q.options.length]];
      else answers[q.id] = 'Тестовый ответ ' + (i+1);
    });
    respArr.push({ id: uid(), surveyId: s1id, anketaId: a1id, participantName: names[i], answers, submittedAt: Date.now() - 86400000 * (6-i) });
  }
  Store.responses = respArr;

  Store.seeded = true;
}

let currentSurveyId        = null;
let currentAnketaId        = null;
let _activeQId             = null;
let _pendingStyles         = {};
let _editingAnketa         = null;
let _hasUnsavedChanges     = false;
let _pendingNavPage        = null;
let currentSurveyTab       = 'opros';
let _surveySearch          = '';
let currentStudentSurveyId = null;
let currentStudentAnketaId = null;
let _pendingStartSurveyId  = null;
let _renameCallback        = null;
let _confirmCallback       = null;

const PAGES = ['dashboard','survey-detail','ankety','anketa-editor','ssylki','otchety','student-survey'];
const NAV_MAP = {
  'dashboard':      'nav-oprosy',
  'survey-detail':  'nav-oprosy',
  'ankety':         'nav-ankety',
  'anketa-editor':  'nav-ankety',
  'ssylki':         'nav-ssylki',
  'otchety':        'nav-otchety',
  'student-survey': null,
};
const SEARCH_PAGES = ['survey-detail'];
const NOTITLE_PAGES = ['ankety','ssylki'];
const BREADCRUMB_PAGES = ['anketa-editor'];

function goPage(id) {
  if (id !== 'anketa-editor') {
    if (_editingAnketa && _hasUnsavedChanges) {
      _pendingNavPage = id;
      openModal('modal-unsaved');
      return;
    }
    _editingAnketa = null;
    _pendingStyles = {};
    _activeQId = null;
    _hasUnsavedChanges = false;
  }

  const auth = sessionStorage.getItem('sibgiu_auth');
  if (auth !== 'admin' && id !== 'student-survey') {
    if (!auth) { showLoginOverlay(); return; }
    
    if (auth === 'participant') return;
  }

  document.getElementById('app-shell').classList.toggle('student-mode', id === 'student-survey');

  PAGES.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('active', p === id);
  });

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navId = NAV_MAP[id];
  if (navId) document.getElementById(navId).classList.add('active');

  const MOB_NAV_MAP = {
    'dashboard': 'mob-nav-oprosy', 'survey-detail': 'mob-nav-oprosy',
    'ankety': 'mob-nav-ankety', 'anketa-editor': 'mob-nav-ankety',
    'ssylki': 'mob-nav-ssylki', 'otchety': 'mob-nav-otchety'
  };
  document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));
  const mobNavId = MOB_NAV_MAP[id];
  if (mobNavId) { const mn = document.getElementById(mobNavId); if (mn) mn.classList.add('active'); }

  const isSearch = SEARCH_PAGES.includes(id);
  const isNoTitle = NOTITLE_PAGES.includes(id);
  const isBreadcrumb = BREADCRUMB_PAGES.includes(id);
  document.getElementById('header-title').classList.toggle('hidden', isSearch || isNoTitle || isBreadcrumb);
  document.getElementById('header-search').classList.toggle('hidden', !isSearch);
  document.getElementById('header-breadcrumb').classList.toggle('hidden', !isBreadcrumb);
  const pageLabels = { ankety: 'Анкеты', ssylki: 'Ссылки' };
  const lbl = document.getElementById('header-page-label');
  lbl.classList.toggle('hidden', !isNoTitle);
  if (isNoTitle) lbl.textContent = pageLabels[id] || '';

  
  if (id !== 'survey-detail') {
    _surveySearch = '';
    const inp = document.getElementById('header-search-input');
    if (inp) inp.value = '';
  }

  const appContent = document.getElementById('app-content');
  if (appContent) appContent.scrollTop = 0;
  window.scrollTo(0, 0);
  document.querySelectorAll('.ctx-menu.open').forEach(m => m.classList.remove('open'));

  
  if (id === 'dashboard')     renderDashboard();
  if (id === 'survey-detail') renderSurveyDetail();
  if (id === 'ankety')        renderAnketyList();
  if (id === 'anketa-editor') renderAnketaEditor();
  if (id === 'ssylki')          renderPrograms();
  if (id === 'otchety')         renderReports();
  if (id === 'student-survey')  renderStudentSurvey();
}

function onHeaderSearch() {
  const activePage = PAGES.find(p => document.getElementById('page-'+p)?.classList.contains('active'));
  if (activePage === 'ankety')  renderAnketyList();
  if (activePage === 'ssylki')  renderPrograms();
  if (activePage === 'survey-detail') {
    _surveySearch = document.getElementById('header-search-input').value.trim().toLowerCase();
    const s = Store.surveys.find(x => x.id === currentSurveyId);
    if (!s) return;
    if (currentSurveyTab === 'opros') renderSurveyOpros(s);
  }
}

const STATUS_LABELS = { active: 'Активен', completed: 'Завершён', draft: 'Черновик' };
const STATUS_BADGE  = { active: 'badge-active', completed: 'badge-completed', draft: 'badge-draft' };
const STATUS_STRIP  = { active: '', completed: 'completed', draft: 'draft' };

function renderDashboard() {
  const q        = (document.getElementById('dash-search')?.value || '').toLowerCase();
  const status   = document.getElementById('dash-status')?.value  || '';
  const category = document.getElementById('dash-category')?.value || '';

  let surveys = Store.surveys;
  if (q)        surveys = surveys.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  if (status)   surveys = surveys.filter(s => s.status === status);
  if (category) surveys = surveys.filter(s => s.category === category);
  surveys = applySort(surveys, _dashSort, 'title');

  const cont = document.getElementById('surveys-container');
  if (!surveys.length) {
    cont.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#bdbdbd" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <p>Опросы не найдены</p><small>Измените параметры фильтрации</small></div>`;
    return;
  }

  cont.innerHTML = '<div class="survey-cards">' + surveys.map(s => {
    const sbl   = STATUS_BADGE[s.status]  || '';
    const strip = STATUS_STRIP[s.status]  || '';
    const label = STATUS_LABELS[s.status] || s.status;
    const respCount = Store.responses.filter(r => r.surveyId === s.id).length;
    return `<div class="survey-card" onclick="openSurvey('${s.id}')">
      <div class="survey-card-inner">
        <div class="survey-card-strip ${strip}"></div>
        <div class="survey-card-body">
          <div class="survey-card-top">
            <span class="badge">${escHtml(s.category)}</span>
            <span class="badge ${sbl}">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
              ${label}
            </span>
            <span style="font-size:12px;color:#9e9e9e;margin-left:4px">${respCount} отв.</span>
            <div style="position:relative;margin-left:auto" onclick="event.stopPropagation()">
              <button class="dots-btn" onclick="toggleSurveyCtx(this,'${s.id}')">&#8943;</button>
              <div class="ctx-menu">
                <div class="ctx-item" onclick="openSurvey('${s.id}')">Открыть</div>
                <div class="ctx-item" onclick="openEditSurvey('${s.id}',event)">Редактировать</div>
                <div class="ctx-item danger" onclick="deleteSurvey('${s.id}',event)">Удалить</div>
              </div>
            </div>
          </div>
          <div class="survey-card-content">
            <div class="date-badge">${fmtDateRange(s.dateStart, s.dateEnd)}</div>
            <div class="survey-desc">${escHtml(s.title)}</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('') + '</div>';
}

function openSurvey(id) {
  currentSurveyId = id;
  currentSurveyTab = 'opros';
  goPage('survey-detail');
}

let _surveyEditId = null;

const _sfLabels = { draft:'Черновик', active:'Активен', completed:'Завершён' };
function sfSet(inputId, optEl, value, label) {
  document.getElementById(inputId).value = value;
  const drop = optEl.closest('.csel-drop');
  const trigger = drop.previousElementSibling;
  trigger.querySelector('.csel-val').textContent = label || value;
  drop.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('active'));
  optEl.classList.add('active');
  drop.classList.remove('open');
  trigger.classList.remove('open');
}
function sfSync(inputId, value) {
  document.getElementById(inputId).value = value;
  const inp = document.getElementById(inputId);
  const drop = inp.nextElementSibling?.querySelector('.csel-drop');
  const trigger = inp.nextElementSibling?.querySelector('.csel');
  if (!drop || !trigger) return;
  const label = _sfLabels[value] || value;
  trigger.querySelector('.csel-val').textContent = label;
  drop.querySelectorAll('.csel-opt').forEach(o => {
    o.classList.toggle('active', o.textContent.trim() === label || o.textContent.trim() === value);
  });
}

function openCreateSurvey() {
  _surveyEditId = null;
  document.getElementById('modal-survey-form-title').textContent = 'Создать опрос';
  document.getElementById('sf-title').value      = '';
  document.getElementById('sf-desc').value       = '';
  sfSync('sf-category', 'Обучающиеся');
  sfSync('sf-status', 'draft');
  document.getElementById('sf-datestart').value  = today();
  const d = new Date(); d.setMonth(d.getMonth()+3);
  document.getElementById('sf-dateend').value    = d.toISOString().slice(0,10);
  openModal('modal-survey-form');
}

function openEditSurvey(id, e) {
  if (e) e.stopPropagation();
  const s = Store.surveys.find(x => x.id === id);
  if (!s) return;
  _surveyEditId = id;
  document.getElementById('modal-survey-form-title').textContent = 'Редактировать опрос';
  document.getElementById('sf-title').value     = s.title;
  document.getElementById('sf-desc').value      = s.description || '';
  sfSync('sf-category', s.category);
  sfSync('sf-status', s.status);
  document.getElementById('sf-datestart').value = s.dateStart || '';
  document.getElementById('sf-dateend').value   = s.dateEnd   || '';
  openModal('modal-survey-form');
}

function saveSurveyForm() {
  const title = document.getElementById('sf-title').value.trim();
  if (!title) { toast('Введите название опроса'); return; }

  const data = {
    title,
    description: document.getElementById('sf-desc').value.trim(),
    category:    document.getElementById('sf-category').value,
    status:      document.getElementById('sf-status').value,
    dateStart:   document.getElementById('sf-datestart').value,
    dateEnd:     document.getElementById('sf-dateend').value,
  };

  const surveys = Store.surveys;
  if (_surveyEditId) {
    const s = surveys.find(x => x.id === _surveyEditId);
    if (s) Object.assign(s, data);
    toast('Опрос обновлён');
  } else {
    surveys.unshift({ id: uid(), ...data, anketaIds: [], programIds: [], groups: [], createdAt: Date.now() });
    toast('Опрос создан');
  }
  Store.surveys = surveys;
  closeModal('modal-survey-form');
  renderDashboard();
}

function deleteSurvey(id, e) {
  if (e) e.stopPropagation();
  const s = Store.surveys.find(x => x.id === id);
  if (!s) return;
  document.getElementById('modal-confirm-title').textContent = 'Удалить опрос?';
  document.getElementById('modal-confirm-text').textContent  = `Вы уверены, что хотите удалить опрос «${s.title.slice(0,60)}»? Это нельзя отменить.`;
  _confirmCallback = () => {
    Store.surveys   = Store.surveys.filter(x => x.id !== id);
    Store.responses = Store.responses.filter(x => x.surveyId !== id);
    closeModal('modal-confirm');
    renderDashboard();
    toast('Опрос удалён');
  };
  openModal('modal-confirm');
}

function toggleSurveyCtx(btn, id) {
  const menu = btn.nextElementSibling;
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.ctx-menu.open').forEach(m => m.classList.remove('open'));
  if (!isOpen) { positionCtxMenu(btn, menu); menu.classList.add('open'); }
}

function openCreateAnketa() {
  document.getElementById('ca-name').value = '';
  openModal('modal-create-anketa');
}

function saveCreateAnketa() {
  const name = document.getElementById('ca-name').value.trim();
  if (!name) { toast('Введите название анкеты'); return; }
  const newAnketa = { id: uid(), name, dateModified: Date.now(), questions: [] };
  const ankety = Store.ankety;
  ankety.unshift(newAnketa);
  Store.ankety = ankety;
  closeModal('modal-create-anketa');
  renderAnketyList();
  toast('Анкета создана');
  
  currentAnketaId = newAnketa.id;
  goPage('anketa-editor');
}

let _programEditId = null;

function openCreateProgram() {
  _programEditId = null;
  document.getElementById('modal-program-title').textContent = 'Новая программа';
  document.getElementById('cp-code').value    = '';
  document.getElementById('cp-name').value    = '';
  document.getElementById('cp-program').value = '';
  openModal('modal-create-program');
}

function openEditProgram(id, e) {
  if (e) e.stopPropagation();
  const p = Store.programs.find(x => x.id === id);
  if (!p) return;
  _programEditId = id;
  document.getElementById('modal-program-title').textContent = 'Редактировать программу';
  document.getElementById('cp-code').value    = p.code;
  document.getElementById('cp-name').value    = p.name;
  document.getElementById('cp-program').value = p.programName;
  openModal('modal-create-program');
}

function saveCreateProgram() {
  const code    = document.getElementById('cp-code').value.trim();
  const name    = document.getElementById('cp-name').value.trim();
  const program = document.getElementById('cp-program').value.trim();
  if (!code || !name) { toast('Заполните обязательные поля'); return; }

  const programs = Store.programs;
  if (_programEditId) {
    const p = programs.find(x => x.id === _programEditId);
    if (p) { p.code = code; p.name = name; p.programName = program; p.dateModified = Date.now(); }
    toast('Программа обновлена');
  } else {
    programs.unshift({ id: uid(), code, name, programName: program, dateModified: Date.now() });
    toast('Программа добавлена');
  }
  Store.programs = programs;
  closeModal('modal-create-program');
  renderPrograms();
}

function renderSurveyDetail() {
  const s = Store.surveys.find(x => x.id === currentSurveyId);
  if (!s) { goPage('dashboard'); return; }

  document.getElementById('bc-survey-name').textContent = s.title.length > 50 ? s.title.slice(0,50)+'…' : s.title;

  
  document.querySelectorAll('#page-survey-detail .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#page-survey-detail .tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-opros-btn').classList.add('active');
  document.getElementById('survey-opros').classList.add('active');
  currentSurveyTab = 'opros';

  renderSurveyOpros(s);
  renderSurveyNastroyki(s);
}

function switchSurveyTab(pane, btn) {
  document.querySelectorAll('#page-survey-detail .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#page-survey-detail .tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('survey-' + pane).classList.add('active');
  currentSurveyTab = pane;
  
  if (_surveySearch) {
    const s = Store.surveys.find(x => x.id === currentSurveyId);
    if (s) {
      if (pane === 'opros') renderSurveyOpros(s);
    }
  }
  if (pane === 'dostup') renderSurveyAccess(currentSurveyId);
}

function renderSurveyOpros(s) {
  const allAnkety  = Store.ankety;
  const allPrograms = Store.programs;
  const q = _surveySearch;

  const anketaRows = (s.anketaIds || []).map(aid => {
    const a = allAnkety.find(x => x.id === aid);
    if (!a) return '';
    if (q && !a.name.toLowerCase().includes(q)) return '';
    return `<li class="cl-row">
      <div class="cl-text"><strong>${escHtml(a.name)}</strong><small>id ${a.id}</small></div>
      <button style="margin-left:auto;color:#e53935;background:none;border:none;cursor:pointer;font-size:12px" onclick="removeAnketaFromSurvey('${aid}')">Убрать</button>
    </li>`;
  }).join('') || `<li class="cl-empty">${q ? 'Ничего не найдено' : 'Анкеты не добавлены'}</li>`;

  const programRows = (s.programIds || []).map(pid => {
    const p = allPrograms.find(x => x.id === pid);
    if (!p) return '';
    if (q && !p.name.toLowerCase().includes(q) && !p.programName.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return '';
    return `<li class="cl-row">
      <div class="cl-text"><strong>${escHtml(p.name)}</strong><small>${escHtml(p.code)} · ${escHtml(p.programName)}</small></div>
      <button style="margin-left:auto;color:#e53935;background:none;border:none;cursor:pointer;font-size:12px" onclick="removeProgramFromSurvey('${pid}')">Убрать</button>
    </li>`;
  }).join('') || `<li class="cl-empty">${q ? 'Ничего не найдено' : 'Программы не добавлены'}</li>`;

  const groupRows = (s.groups || []).filter(g => !q || g.toLowerCase().includes(q)).map(g => `
    <li class="cl-row">
      <input type="checkbox">
      <div class="cl-text"><strong>${escHtml(g)}</strong></div>
      <button style="margin-left:auto;color:#e53935;background:none;border:none;cursor:pointer;font-size:12px" onclick="removeGroupFromSurvey('${escHtml(g)}')">Убрать</button>
    </li>`).join('') || `<li class="cl-empty">${q ? 'Ничего не найдено' : 'Группы не добавлены'}</li>`;

  const statusLabel = STATUS_LABELS[s.status] || s.status;
  const respCount = Store.responses.filter(r => r.surveyId === s.id).length;

  document.getElementById('survey-opros').innerHTML = `
    <div class="detail-main">
      <div class="detail-left">
        <div class="detail-title">${escHtml(s.title)}</div>
        <div class="detail-votes">
          <span class="vote-up">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg>
            ${respCount} ответов
          </span>
        </div>
      </div>
      <div class="detail-meta">
        <div class="meta-row"><span class="ml">Дата начала:</span><span class="mv">${fmtDate(s.dateStart ? new Date(s.dateStart).getTime() : null)}</span></div>
        <div class="meta-row"><span class="ml">Дата конца:</span><span class="mv">${fmtDate(s.dateEnd ? new Date(s.dateEnd).getTime() : null)}</span></div>
        <div class="meta-row"><span class="ml">Статус:</span><span class="mv">${statusLabel}</span></div>
        <div class="meta-row"><span class="ml">Категория:</span><span class="mv">${escHtml(s.category)}</span></div>
      </div>
    </div>

    <div class="section-block">
      <div class="section-head">
        <div class="section-title">Анкеты для опроса</div>
        <button class="btn btn-blue btn-sm" onclick="openAddAnketaModal()">Добавить</button>
      </div>
      <ul class="checklist">
        <li class="cl-header">Анкеты</li>
        ${anketaRows}
      </ul>
    </div>

    <div class="section-block">
      <div class="section-head">
        <div class="section-title">Образовательные программы</div>
        <button class="btn btn-blue btn-sm" onclick="openAddProgramModal()">Добавить</button>
      </div>
      <ul class="checklist">
        <li class="cl-header">Название программы</li>
        ${programRows}
      </ul>
    </div>

    <div class="section-block">
      <div class="section-head">
        <div class="section-title">Группа анкетируемых</div>
        <button class="btn btn-blue btn-sm" onclick="openModal('modal-add-group')">Добавить</button>
      </div>
      <ul class="checklist">
        <li class="cl-header">Название группы</li>
        ${groupRows}
      </ul>
    </div>
  `;
}

function renderSurveyOtvety(s) {
  const allResponses = Store.responses.filter(r => r.surveyId === s.id);
  const q = _surveySearch;
  const responses = q
    ? allResponses.filter(r => r.participantName.toLowerCase().includes(q))
    : allResponses;

  if (!allResponses.length) {
    document.getElementById('survey-otvety').innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#bdbdbd" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <p>Ответов пока нет</p><small>Участники ещё не заполнили анкеты</small>
      </div>`;
    return;
  }

  const rows = responses.map(r => {
    const anketa = Store.ankety.find(a => a.id === r.anketaId);
    return `<li class="cl-row">
      <div class="cl-text">
        <strong>${escHtml(r.participantName)}</strong>
        <small>${anketa ? escHtml(anketa.name) : 'Анкета удалена'} · ${fmtDate(r.submittedAt)}</small>
      </div>
    </li>`;
  }).join('') || `<li class="cl-empty">Ничего не найдено</li>`;

  document.getElementById('survey-otvety').innerHTML = `
    <div class="participants-title">Участники опроса (${responses.length}${q ? ' из '+allResponses.length : ''})</div>
    <ul class="checklist">
      <li class="cl-header">Участники:</li>
      ${rows}
    </ul>`;
}

function renderSurveyNastroyki(s) {
  document.getElementById('survey-nastroyki').innerHTML = `
    <div class="settings-block">
      <div class="settings-title">Настройки опроса</div>

      <div class="settings-row">
        <label>Статус</label>
        <div class="toggle-wrap">
          <div class="toggle-sw ${s.status==='active'?'on':''}" id="status-toggle" onclick="toggleSurveyStatus()"></div>
          <span id="status-label">${s.status==='active'?'Активен':'Неактивен'}</span>
        </div>
      </div>

      <div class="settings-row">
        <label>Дата начала</label>
        <input type="date" class="form-input" id="sett-datestart" value="${s.dateStart||''}" style="width:180px;padding:8px 10px">
      </div>
      <div class="settings-row">
        <label>Дата конца</label>
        <input type="date" class="form-input" id="sett-dateend" value="${s.dateEnd||''}" style="width:180px;padding:8px 10px">
      </div>

      <div class="sep" style="margin:20px 0"></div>
      <div class="settings-title" style="font-size:16px">Название опроса</div>
      <textarea class="modal-textarea" id="sett-title" style="margin-bottom:12px">${escHtml(s.title)}</textarea>

      <div class="settings-title" style="font-size:16px">Описание опроса</div>
      <textarea class="modal-textarea" id="sett-desc">${escHtml(s.description||'')}</textarea>

      <div class="settings-row" style="margin-top:14px">
        <label>Категория</label>
        <input type="hidden" id="sett-category" value="${escHtml(s.category||'Обучающиеся')}">
        <div class="csel-wrap">
          <div class="csel" onclick="toggleCsel(this)" style="font-size:13px;padding:7px 28px 7px 12px;min-width:160px">
            <span class="csel-val">${escHtml(s.category||'Обучающиеся')}</span>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="csel-drop">
            ${['Обучающиеся','Преподаватели','Сотрудники','Гости'].map(c=>`
            <div class="csel-opt${s.category===c?' active':''}" onclick="document.getElementById('sett-category').value=this.textContent;setCsel(this,'${c}','${c}')">${c}</div>`).join('')}
          </div>
        </div>
      </div>

      <button class="btn-save-full" onclick="saveSurveySettings()">Сохранить настройки</button>
    </div>`;
}

function toggleSurveyStatus() {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (!s) return;
  s.status = s.status === 'active' ? 'completed' : 'active';
  Store.surveys = surveys;
  const tog = document.getElementById('status-toggle');
  const lbl = document.getElementById('status-label');
  if (tog) { tog.classList.toggle('on', s.status==='active'); }
  if (lbl) { lbl.textContent = s.status==='active'?'Активен':'Неактивен'; }
  toast('Статус обновлён');
}

function saveSurveySettings() {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (!s) return;
  s.title       = document.getElementById('sett-title')?.value || s.title;
  s.description = document.getElementById('sett-desc')?.value || '';
  s.dateStart   = document.getElementById('sett-datestart')?.value || '';
  s.dateEnd     = document.getElementById('sett-dateend')?.value || '';
  s.category    = document.getElementById('sett-category')?.value || s.category;
  Store.surveys = surveys;
  renderSurveyOpros(s);
  document.getElementById('bc-survey-name').textContent = s.title.length > 50 ? s.title.slice(0,50)+'…' : s.title;
  toast('Настройки сохранены');
}

function openAddAnketaModal() {
  document.getElementById('modal-anketa-search').value = '';
  renderModalAnketaList();
  openModal('modal-add-anketa');
}

function renderModalAnketaList() {
  const q = document.getElementById('modal-anketa-search').value.toLowerCase();
  const s = Store.surveys.find(x => x.id === currentSurveyId);
  const allAnkety = Store.ankety.filter(a => !q || a.name.toLowerCase().includes(q));
  document.getElementById('modal-anketa-list').innerHTML = allAnkety.map(a => {
    const linked = s && (s.anketaIds||[]).includes(a.id);
    return `<div class="modal-item">
      <input type="checkbox" id="ma-${a.id}" ${linked?'checked':''} data-aid="${a.id}">
      <div class="modal-item-text"><strong>${escHtml(a.name)}</strong><small>${fmtDate(a.dateModified)}</small></div>
    </div>`;
  }).join('') || '<p style="color:#9e9e9e;padding:8px 0">Анкеты не найдены</p>';
}

function confirmAddAnketa() {
  const checked = [...document.querySelectorAll('#modal-anketa-list input[type=checkbox]:checked')].map(cb => cb.dataset.aid);
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.anketaIds = checked; Store.surveys = surveys; }
  closeModal('modal-add-anketa');
  renderSurveyOpros(s);
  toast('Анкеты обновлены');
}

function removeAnketaFromSurvey(aid) {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.anketaIds = (s.anketaIds||[]).filter(x => x !== aid); Store.surveys = surveys; }
  renderSurveyOpros(s);
  toast('Анкета убрана из опроса');
}

function openAddProgramModal() {
  document.getElementById('modal-prog-search').value = '';
  renderModalProgramList();
  openModal('modal-add-program-survey');
}

function renderModalProgramList() {
  const q = document.getElementById('modal-prog-search').value.toLowerCase();
  const s = Store.surveys.find(x => x.id === currentSurveyId);
  const progs = Store.programs.filter(p => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  document.getElementById('modal-prog-list').innerHTML = progs.map(p => {
    const linked = s && (s.programIds||[]).includes(p.id);
    return `<div class="modal-item">
      <input type="checkbox" id="mp-${p.id}" ${linked?'checked':''} data-pid="${p.id}">
      <div class="modal-item-text"><strong>${escHtml(p.name)}</strong><small>${escHtml(p.code)} · ${escHtml(p.programName)}</small></div>
    </div>`;
  }).join('') || '<p style="color:#9e9e9e;padding:8px 0">Программы не найдены</p>';
}

function confirmAddProgram() {
  const checked = [...document.querySelectorAll('#modal-prog-list input[type=checkbox]:checked')].map(cb => cb.dataset.pid);
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.programIds = checked; Store.surveys = surveys; }
  closeModal('modal-add-program-survey');
  renderSurveyOpros(s);
  toast('Программы обновлены');
}

function removeProgramFromSurvey(pid) {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.programIds = (s.programIds||[]).filter(x => x !== pid); Store.surveys = surveys; }
  renderSurveyOpros(s);
  toast('Программа убрана из опроса');
}

function confirmAddGroup() {
  const custom = document.getElementById('modal-group-custom').value.trim();
  const sel    = document.getElementById('modal-group-sel').value;
  const group  = custom || sel;
  if (!group) { toast('Укажите группу'); return; }
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) {
    if (!(s.groups||[]).includes(group)) { s.groups = [...(s.groups||[]), group]; }
    Store.surveys = surveys;
  }
  document.getElementById('modal-group-custom').value = '';
  closeModal('modal-add-group');
  renderSurveyOpros(s);
  toast('Группа добавлена');
}

function removeGroupFromSurvey(group) {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.groups = (s.groups||[]).filter(g => g !== group); Store.surveys = surveys; }
  renderSurveyOpros(s);
  toast('Группа убрана');
}

function renderAnketyList() {
  const q = (document.getElementById('ankety-search')?.value || '').toLowerCase();
  let ankety = Store.ankety;
  if (q) ankety = ankety.filter(a => a.name.toLowerCase().includes(q));
  ankety = applySort(ankety, _listSort.ankety, 'name');

  const cont = document.getElementById('ankety-list');
  if (!ankety.length) {
    cont.innerHTML = `<div class="empty-state"><svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#bdbdbd" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><p>Анкеты не найдены</p></div>`;
    return;
  }
  cont.innerHTML = ankety.map(a => `
    <div class="list-row" onclick="openAnketa('${a.id}')">
      <div class="col-name"><strong>${escHtml(a.name)}</strong><small>${a.questions.length} вопр. · id ${a.id}</small></div>
      <div class="col-date">${fmtDate(a.dateModified)}</div>
      <div class="col-act">
        <button class="dots-btn" onclick="event.stopPropagation();toggleCtx(this)">&#8943;</button>
        <div class="ctx-menu">
          <div class="ctx-item" onclick="event.stopPropagation();openAnketa('${a.id}')">Редактировать</div>
          <div class="ctx-item" onclick="event.stopPropagation();startRename('anketa','${a.id}','${escHtml(a.name)}')">Переименовать</div>
          <div class="ctx-item danger" onclick="event.stopPropagation();confirmDelete('anketa','${a.id}','${escHtml(a.name)}')">Удалить</div>
        </div>
      </div>
    </div>`).join('');
}

function openAnketa(id) {
  currentAnketaId = id;
  goPage('anketa-editor');
  const a = Store.ankety.find(x => x.id === id);
  const bc = document.getElementById('header-breadcrumb');
  if (bc && a) bc.innerHTML = `<span class="bc-link" onclick="goPage('ankety')">Анкеты</span> / ${escHtml(a.name)}`;
}

function renderAnketaEditor() {
  if (!_editingAnketa || _editingAnketa.id !== currentAnketaId) {
    const a = Store.ankety.find(x => x.id === currentAnketaId);
    if (!a) { goPage('ankety'); return; }
    _editingAnketa = JSON.parse(JSON.stringify(a));
    _pendingStyles = {};
    _hasUnsavedChanges = false;
  }
  const a = _editingAnketa;

  document.getElementById('bc-anketa-name').textContent = a.name;

  const epName = document.getElementById('ep-anketa-name');
  if (epName) epName.value = a.name;
  const epCount = document.getElementById('ep-q-count');
  if (epCount) {
    const n = (a.questions || []).length;
    epCount.textContent = n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'вопрос' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'вопроса' : 'вопросов'));
  }

  const main = document.getElementById('editor-main');
  const qCards = (a.questions || []).map((q, idx) => buildQuestionCard(q, idx)).join('');
  main.innerHTML = qCards + `
    <div class="add-q-bar" onclick="addQuestion()">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      Добавить вопрос
    </div>`;
}

function qTypeSelect(el, qId, val, label) {
  const wrap = el.closest('.csel-wrap');
  wrap.querySelector('.csel-val').textContent = label;
  wrap.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  wrap.querySelector('.csel-drop').classList.remove('open');
  wrap.querySelector('.csel').classList.remove('open');
  changeQType(qId, val);
}

function buildQuestionCard(q, idx) {
  const typeOptions = [
    {val:'text',      label:'Текст (Строка)'},
    {val:'paragraph', label:'Текст (Абзац)'},
    {val:'radio',     label:'Один из списка'},
    {val:'checkbox',  label:'Несколько из списка'},
  ];
  const currentLabel = typeOptions.find(t => t.val === q.type)?.label || '';
  const typeSelHtml = `
    <div class="csel-wrap">
      <div class="csel" onclick="toggleCsel(this)" style="font-size:12px;padding:5px 26px 5px 9px;min-width:130px">
        <span class="csel-val">${currentLabel}</span>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="csel-drop">
        ${typeOptions.map(t => `<div class="csel-opt${q.type===t.val?' active':''}" onclick="qTypeSelect(this,'${q.id}','${t.val}','${t.label}')">${t.label}</div>`).join('')}
      </div>
    </div>`;

  let ansArea = '';
  if (q.type === 'text') {
    ansArea = `<input class="q-ans-input" placeholder="Краткий ответ" type="text" disabled>`;
  } else if (q.type === 'paragraph') {
    ansArea = `<textarea class="q-ans-input" placeholder="Развёрнутый ответ" disabled style="resize:none;height:60px"></textarea>`;
  } else {
    const inputType = q.type === 'radio' ? 'radio' : 'checkbox';
    const opts = (q.options||[]).map((opt, oi) => `
      <div class="q-opt">
        <input type="${inputType}" name="q_${q.id}" disabled>
        <input type="text" value="${escHtml(opt)}" style="border:none;border-bottom:1px solid #e0e0e0;outline:none;font-size:14px;flex:1;background:transparent"
          onchange="updateOption('${q.id}',${oi},this.value)">
        <button style="color:#9e9e9e;background:none;border:none;cursor:pointer;font-size:16px;line-height:1" onclick="removeOption('${q.id}',${oi})">×</button>
      </div>`).join('');
    ansArea = `<div class="q-opts" id="opts-${q.id}">${opts}
      <button class="add-opt-btn" onclick="addOption('${q.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0078ff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Добавить вариант
      </button></div>`;
  }

  const qs = Object.assign({}, q.style || {}, _pendingStyles[q.id] || {});
  const wMap = {'Bold':'700','Medium':'500','Regular':'400','Italic':'400'};
  const qStyleStr = [
    qs.align ? `text-align:${qs.align}` : '',
    qs.fontFamily ? `font-family:${qs.fontFamily}` : '',
    (wMap[qs.fontStyle]) ? `font-weight:${wMap[qs.fontStyle]}` : '',
    (qs.fontStyle==='Italic'||qs.italic) ? 'font-style:italic' : '',
    qs.fontSize ? `font-size:${qs.fontSize}px` : '',
    qs.fontColor ? `color:${qs.fontColor}` : '',
    qs.lineHeight ? `line-height:${qs.lineHeight}` : '',
    qs.paragraph ? `margin-bottom:${qs.paragraph}px` : '',
    (qs.underline||qs.strike) ? `text-decoration:${[qs.underline?'underline':'',qs.strike?'line-through':''].filter(Boolean).join(' ')}` : '',
  ].filter(Boolean).join(';');

  return `<div class="q-card" id="qcard-${q.id}" onclick="activateCard('${q.id}')">
    <div class="q-card-top">
      <div class="q-card-accent"></div>
      <div class="q-card-body">
        <div class="q-card-head-area">
          <textarea class="q-text-input" rows="2" placeholder="Место для текста" style="${qStyleStr}"
            onchange="updateQText('${q.id}',this.value)">${escHtml(q.text)}</textarea>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            ${typeSelHtml}
            <span id="req-star-${q.id}" style="color:#e53935;font-size:16px;margin-left:2px;display:${q.required?'inline':'none'}">*</span>
          </div>
        </div>
        <div class="q-card-ans-area">
          <input class="q-desc-input" placeholder="Описание (необязательно)" type="text" value="${escHtml(q.description||'')}" oninput="updateQDesc('${q.id}',this.value)">
          ${ansArea}
        </div>
      </div>
    </div>
    <div class="q-footer">
      <button class="q-icon-btn" title="Вверх" onclick="event.stopPropagation();moveQuestion('${q.id}',-1)" style="font-size:15px;line-height:1">↑</button>
      <button class="q-icon-btn" title="Вниз" onclick="event.stopPropagation();moveQuestion('${q.id}',1)" style="font-size:15px;line-height:1">↓</button>
      <div style="flex:1"></div>
      <button class="q-icon-btn" title="Дублировать" onclick="event.stopPropagation();duplicateQuestion('${q.id}')">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="q-icon-btn" title="Удалить" onclick="event.stopPropagation();deleteQuestion('${q.id}')">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
      <div class="required-toggle">
        Обязательный
        <div class="toggle-sw ${q.required?'on':''}" onclick="toggleRequired('${q.id}',this)"></div>
      </div>
    </div>
  </div>`;
}

function activateCard(qId) {
  document.querySelectorAll('.q-card').forEach(c => c.classList.remove('active-q'));
  const card = document.getElementById('qcard-' + qId);
  if (card) card.classList.add('active-q');
  _activeQId = qId;
  loadEditorForQ(qId);
}

function loadEditorForQ(qId) {
  if (!_editingAnketa) return;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q) return;
  const s = Object.assign({}, q.style || {}, _pendingStyles[qId] || {});
  const alignValues = ['left','center','right','justify'];
  document.querySelectorAll('.ep-align-btn').forEach((b, i) => b.classList.toggle('active', alignValues[i] === (s.align||'left')));
  const ffEl = document.getElementById('ep-font-family');
  if (ffEl) { ffEl.value = s.fontFamily||'Helvetica'; ffEl.previousElementSibling && (ffEl.previousElementSibling.querySelector('.csel-val').textContent = s.fontFamily||'Helvetica'); }
  const fsEl = document.getElementById('ep-font-style');
  if (fsEl) { fsEl.value = s.fontStyle||'Regular'; fsEl.previousElementSibling && (fsEl.previousElementSibling.querySelector('.csel-val').textContent = s.fontStyle||'Regular'); }
  const fzEl = document.getElementById('ep-font-size'); if (fzEl) fzEl.value = s.fontSize||16;
  const fcEl = document.getElementById('ep-font-color'); if (fcEl) fcEl.value = s.fontColor||'#000000';
  const cpEl = document.getElementById('ep-color-picker'); if (cpEl) cpEl.value = s.fontColor||'#000000';
  const lhEl = document.getElementById('ep-line-height'); if (lhEl) lhEl.value = s.lineHeight||1.5;
  const paEl = document.getElementById('ep-paragraph'); if (paEl) paEl.value = s.paragraph||8;
  const ib = document.getElementById('ep-btn-italic'); if (ib) ib.classList.toggle('active', !!s.italic);
  const sb = document.getElementById('ep-btn-strike'); if (sb) sb.classList.toggle('active', !!s.strike);
  const ub = document.getElementById('ep-btn-underline'); if (ub) ub.classList.toggle('active', !!s.underline);
}

function saveActiveQStyle(updates) {
  if (!_activeQId || !_editingAnketa) return;
  _hasUnsavedChanges = true;
  if (!_pendingStyles[_activeQId]) {
    const q = _editingAnketa.questions.find(x => x.id === _activeQId);
    _pendingStyles[_activeQId] = Object.assign({}, q?.style || {});
  }
  Object.assign(_pendingStyles[_activeQId], updates);
  applyQStyleToDOM(_activeQId, _pendingStyles[_activeQId]);
}

function getCurrentEditorStyle() {
  const s = {};
  const alignValues = ['left','center','right','justify'];
  const btns = [...document.querySelectorAll('.ep-align-btn')];
  const ai = btns.findIndex(b => b.classList.contains('active'));
  if (ai >= 0) s.align = alignValues[ai];
  const ff = document.getElementById('ep-font-family')?.value; if (ff) s.fontFamily = ff;
  const fs = document.getElementById('ep-font-style')?.value; if (fs) s.fontStyle = fs;
  const fz = parseFloat(document.getElementById('ep-font-size')?.value); if (!isNaN(fz)) s.fontSize = fz;
  const color = document.getElementById('ep-font-color')?.value;
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) s.fontColor = color;
  const lh = parseFloat(document.getElementById('ep-line-height')?.value); if (!isNaN(lh)) s.lineHeight = lh;
  const pa = parseFloat(document.getElementById('ep-paragraph')?.value); if (!isNaN(pa)) s.paragraph = pa;
  s.italic = !!document.getElementById('ep-btn-italic')?.classList.contains('active');
  s.strike = !!document.getElementById('ep-btn-strike')?.classList.contains('active');
  s.underline = !!document.getElementById('ep-btn-underline')?.classList.contains('active');
  return s;
}

function applyStyleToAll() {
  const a = _editingAnketa;
  if (!a) return;
  _hasUnsavedChanges = true;
  const updates = getCurrentEditorStyle();
  a.questions.forEach(q => {
    if (!_pendingStyles[q.id]) _pendingStyles[q.id] = Object.assign({}, q.style || {});
    Object.assign(_pendingStyles[q.id], updates);
    applyQStyleToDOM(q.id, _pendingStyles[q.id]);
  });
  toast('Стиль применён ко всем вопросам');
}

function applyQStyleToDOM(qId, s) {
  const inp = document.querySelector('#qcard-' + qId + ' .q-text-input');
  if (!inp || !s) return;
  inp.style.textAlign = s.align || 'left';
  inp.style.fontFamily = s.fontFamily || '';
  const wMap = {'Bold':'700','Medium':'500','Regular':'400','Italic':'400'};
  inp.style.fontWeight = wMap[s.fontStyle] || '400';
  inp.style.fontStyle = (s.fontStyle === 'Italic' || s.italic) ? 'italic' : 'normal';
  if (s.fontSize) inp.style.fontSize = s.fontSize + 'px';
  inp.style.color = s.fontColor || '';
  if (s.lineHeight) inp.style.lineHeight = s.lineHeight;
  if (s.paragraph !== undefined) inp.style.marginBottom = s.paragraph + 'px';
  const dec = [];
  if (s.underline) dec.push('underline');
  if (s.strike) dec.push('line-through');
  inp.style.textDecoration = dec.length ? dec.join(' ') : '';
}

function updateQText(qId, val) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (q) q.text = val;
}

function updateQDesc(qId, val) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (q) q.description = val;
}

function changeQType(qId, newType) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q) return;
  q.type = newType;
  if ((newType==='radio'||newType==='checkbox') && (!q.options||!q.options.length)) {
    q.options = ['Вариант 1', 'Вариант 2'];
  }
  renderAnketaEditor();
}

function toggleRequired(qId, toggleEl) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q) return;
  q.required = !q.required;
  toggleEl.classList.toggle('on', q.required);
  const star = document.getElementById('req-star-' + qId);
  if (star) star.style.display = q.required ? 'inline' : 'none';
}

function addOption(qId) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q) return;
  q.options = [...(q.options||[]), 'Вариант ' + ((q.options||[]).length + 1)];
  renderAnketaEditor();
}

function removeOption(qId, oi) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q) return;
  q.options.splice(oi, 1);
  renderAnketaEditor();
}

function updateOption(qId, oi, val) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q || !q.options) return;
  q.options[oi] = val;
}

function addQuestion() {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const newQ = { id: uid(), text: '', description: '', type: 'text', required: false, options: [] };
  _editingAnketa.questions.push(newQ);
  renderAnketaEditor();
  const card = document.getElementById('qcard-' + newQ.id);
  if (card) { card.scrollIntoView({behavior:'smooth'}); card.classList.add('active-q'); }
}

function deleteQuestion(qId) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  _editingAnketa.questions = _editingAnketa.questions.filter(q => q.id !== qId);
  renderAnketaEditor();
  toast('Вопрос удалён');
}

function duplicateQuestion(qId) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const q = _editingAnketa.questions.find(x => x.id === qId);
  if (!q) return;
  const newQ = JSON.parse(JSON.stringify(q));
  newQ.id = uid();
  newQ.text = newQ.text ? newQ.text + ' (копия)' : 'Копия вопроса';
  const idx = _editingAnketa.questions.indexOf(q);
  _editingAnketa.questions.splice(idx + 1, 0, newQ);
  renderAnketaEditor();
  toast('Вопрос продублирован');
}

function saveAnketa() {
  if (!_editingAnketa) return;
  for (const [qId, style] of Object.entries(_pendingStyles)) {
    const q = _editingAnketa.questions.find(x => x.id === qId);
    if (q) q.style = Object.assign({}, q.style || {}, style);
  }
  _pendingStyles = {};
  _editingAnketa.dateModified = Date.now();
  const ankety = Store.ankety;
  const idx = ankety.findIndex(x => x.id === _editingAnketa.id);
  if (idx >= 0) ankety[idx] = _editingAnketa;
  Store.ankety = ankety;
  _hasUnsavedChanges = false;
  toast('Анкета сохранена');
}

function setAlign(btn) {
  const alignValues = ['left','center','right','justify'];
  const btns = [...document.querySelectorAll('.ep-align-btn')];
  btns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  saveActiveQStyle({ align: alignValues[btns.indexOf(btn)] || 'left' });
}

function toggleStyle(type, btn) {
  btn.classList.toggle('active');
  saveActiveQStyle({ [type]: btn.classList.contains('active') });
}

function applyFont() {
  const color = document.getElementById('ep-font-color')?.value || '';
  const picker = document.getElementById('ep-color-picker');
  if (picker && /^#[0-9a-fA-F]{6}$/.test(color)) picker.value = color;
  const updates = {};
  const ff = document.getElementById('ep-font-family')?.value; if (ff) updates.fontFamily = ff;
  const fs = document.getElementById('ep-font-style')?.value; if (fs) updates.fontStyle = fs;
  const fz = parseFloat(document.getElementById('ep-font-size')?.value); if (!isNaN(fz)) updates.fontSize = fz;
  if (/^#[0-9a-fA-F]{6}$/.test(color)) updates.fontColor = color;
  const lh = parseFloat(document.getElementById('ep-line-height')?.value); if (!isNaN(lh)) updates.lineHeight = lh;
  const pa = parseFloat(document.getElementById('ep-paragraph')?.value); if (!isNaN(pa)) updates.paragraph = pa;
  saveActiveQStyle(updates);
}

function saveAnketaName(val) {
  const name = val.trim();
  if (!name || !_editingAnketa) return;
  _hasUnsavedChanges = true;
  _editingAnketa.name = name;
  document.getElementById('bc-anketa-name').textContent = name;
  const hbc = document.getElementById('header-breadcrumb');
  if (hbc) hbc.textContent = 'Анкеты / ' + name;
}

function moveQuestion(qId, dir) {
  if (!_editingAnketa) return;
  _hasUnsavedChanges = true;
  const idx = _editingAnketa.questions.findIndex(q => q.id === qId);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= _editingAnketa.questions.length) return;
  const tmp = _editingAnketa.questions[idx];
  _editingAnketa.questions[idx] = _editingAnketa.questions[newIdx];
  _editingAnketa.questions[newIdx] = tmp;
  renderAnketaEditor();
  const card = document.getElementById('qcard-' + qId);
  if (card) { card.classList.add('active-q'); card.scrollIntoView({behavior:'smooth', block:'nearest'}); }
}


function spin(id, delta) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.value = (parseFloat(inp.value) + delta).toFixed(delta < 1 ? 1 : 0);
}

function renderPrograms() {
  const q = (document.getElementById('programs-search')?.value || '').toLowerCase();
  let programs = Store.programs;
  if (q) programs = programs.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.code.toLowerCase().includes(q) ||
    p.programName.toLowerCase().includes(q)
  );
  programs = applySort(programs, _listSort.ssylki, 'name');

  const cont = document.getElementById('programs-list');
  if (!programs.length) {
    cont.innerHTML = `<div class="empty-state"><svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#bdbdbd" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>Программы не найдены</p></div>`;
    return;
  }
  cont.innerHTML = programs.map(p => `
    <div class="list-row">
      <div class="col-name">
        <strong>${escHtml(p.name)}</strong>
        <small>${escHtml(p.code)} · ${escHtml(p.programName)}</small>
      </div>
      <div class="col-date">${fmtDate(p.dateModified)}</div>
      <div class="col-act">
        <button class="dots-btn" onclick="event.stopPropagation();toggleCtx(this)">&#8943;</button>
        <div class="ctx-menu">
          <div class="ctx-item" onclick="event.stopPropagation();openEditProgram('${p.id}',event)">Редактировать</div>
          <div class="ctx-item" onclick="event.stopPropagation();startRename('program','${p.id}','${escHtml(p.name)}')">Переименовать</div>
          <div class="ctx-item danger" onclick="event.stopPropagation();confirmDelete('program','${p.id}','${escHtml(p.name)}')">Удалить</div>
        </div>
      </div>
    </div>`).join('');
}

function renderReports() {
  const allSurveys  = Store.surveys;
  const allResponses = Store.responses;
  const search = (document.getElementById('reports-search')?.value || '').toLowerCase();
  const filter = document.getElementById('reports-filter')?.value || '';

  
  let surveys = allSurveys;
  if (filter) surveys = surveys.filter(s => s.status === filter);
  if (search) surveys = surveys.filter(s => s.title.toLowerCase().includes(search) || (s.description||'').toLowerCase().includes(search));

  const cont = document.getElementById('reports-container');
  if (!surveys.length) {
    cont.innerHTML = `<div class="empty-state"><svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#bdbdbd" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>Ничего не найдено</p></div>`;
    return;
  }

  cont.innerHTML = surveys.map(s => {
    const responses = allResponses.filter(r => r.surveyId === s.id);
    const statusLabel = STATUS_LABELS[s.status] || s.status;
    const badgeCls   = STATUS_BADGE[s.status]  || '';
    const anketaNames = (s.anketaIds||[]).map(aid => {
      const a = Store.ankety.find(x => x.id === aid);
      return a ? escHtml(a.name) : null;
    }).filter(Boolean);

    return `<div class="detail-card" style="margin-bottom:20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;cursor:pointer;user-select:none" onclick="toggleReportBody('${s.id}')">
        <div style="display:flex;align-items:flex-start;gap:10px;flex:1;min-width:0">
          <input type="checkbox" class="report-check" data-id="${s.id}" onchange="updateReportSelection()" onclick="event.stopPropagation()" style="margin-top:4px;flex-shrink:0;cursor:pointer">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:4px">
              <div class="section-title" style="margin:0;flex:1">${escHtml(s.title)}</div>
              <span class="badge ${badgeCls}" style="flex-shrink:0;margin-top:2px">${statusLabel}</span>
            </div>
            <div style="font-size:12px;color:#9e9e9e">${fmtDateRange(s.dateStart, s.dateEnd)}</div>
            ${anketaNames.length ? `<div style="font-size:12px;color:#757575;margin-top:4px">Анкеты: ${anketaNames.join(', ')}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;flex-shrink:0">
          <div style="text-align:right">
            <div style="font-size:28px;font-weight:700;color:#0078ff;line-height:1">${responses.length}</div>
            <div style="font-size:11px;color:#9e9e9e">ответов</div>
          </div>
          <svg id="report-chev-${s.id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .25s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div id="report-body-${s.id}" data-open="0" style="max-height:0;overflow:hidden;opacity:0;transition:max-height .3s ease,opacity .25s ease">
        <div style="padding-top:12px">
          ${responses.length ? buildResponseStats(s, responses) : `<div style="color:#9e9e9e;font-size:13px;padding:12px 0;border-top:1px solid #f5f5f5">Ответов пока нет</div>`}
        </div>
      </div>
    </div>`;
  }).join('');
  updateReportSelection();
}

function toggleReportBody(id) {
  const body = document.getElementById('report-body-' + id);
  const chev = document.getElementById('report-chev-' + id);
  if (!body) return;
  const open = body.dataset.open === '1';
  if (open) {
    body.style.maxHeight = '0';
    body.style.opacity = '0';
    body.dataset.open = '0';
    if (chev) chev.style.transform = '';
  } else {
    body.style.maxHeight = body.scrollHeight + 'px';
    body.style.opacity = '1';
    body.dataset.open = '1';
    if (chev) chev.style.transform = 'rotate(180deg)';
  }
}

function buildResponseStats(s, responses) {
  const anketaIds = [...new Set(responses.map(r => r.anketaId))];
  if (!anketaIds.length) return '';
  return `<div style="border-top:1px solid #f0f0f0;padding-top:16px;margin-top:8px">` +
    anketaIds.map(aid => {
      const anketa = Store.ankety.find(a => a.id === aid);
      if (!anketa) return '';
      const anketaResps = responses.filter(r => r.anketaId === aid);
      const stats = anketa.questions.map(q => {
        if (q.type === 'radio' || q.type === 'checkbox') {
          const counts = {};
          (q.options||[]).forEach(o => counts[o] = 0);
          anketaResps.forEach(r => {
            const ans = r.answers[q.id];
            if (Array.isArray(ans)) ans.forEach(a => { if (counts[a]!==undefined) counts[a]++; });
            else if (ans && counts[ans]!==undefined) counts[ans]++;
          });
          const totalVotes = Object.values(counts).reduce((a,b)=>a+b, 0) || 1;
          const bars = Object.entries(counts).map(([opt, cnt]) => {
            const pct = Math.round(cnt / totalVotes * 100);
            return `<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#424242;margin-bottom:4px">
                <span>${escHtml(opt)}</span>
                <span style="font-weight:600;color:#0078ff">${cnt}&nbsp;<span style="font-weight:400;color:#9e9e9e">(${pct}%)</span></span>
              </div>
              <div style="height:10px;background:#e0efff;border-radius:5px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:#0078ff;border-radius:5px;transition:width .4s"></div>
              </div>
            </div>`;
          }).join('');
          return `<div style="margin-bottom:18px">
            <div style="font-size:13px;font-weight:600;color:#424242;margin-bottom:10px">${escHtml(q.text)}${q.required?'<span style="color:#e53935"> *</span>':''}</div>
            ${bars}
          </div>`;
        } else {
          const answers = anketaResps.map(r => r.answers[q.id]).filter(Boolean);
          if (!answers.length) return '';
          return `<div style="margin-bottom:18px">
            <div style="font-size:13px;font-weight:600;color:#424242;margin-bottom:8px">${escHtml(q.text)}${q.required?'<span style="color:#e53935"> *</span>':''}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${answers.map(a => `<div style="font-size:12px;color:#616161;padding:6px 12px;background:#f7f9ff;border-left:3px solid #0078ff;border-radius:0 6px 6px 0">${escHtml(a)}</div>`).join('')}
            </div>
          </div>`;
        }
      }).filter(Boolean).join('');

      return `<div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="font-size:14px;font-weight:600;color:#0078ff">${escHtml(anketa.name)}</div>
          <span style="font-size:12px;color:#9e9e9e;background:#f0f0f0;padding:2px 8px;border-radius:10px">${anketaResps.length} ответов</span>
        </div>
        ${stats || '<div style="color:#9e9e9e;font-size:12px">Нет данных по вопросам</div>'}
      </div>`;
    }).join('') + `</div>`;
}

function startSurvey(surveyId) {
  const s = Store.surveys.find(x => x.id === surveyId);
  if (!s) return;
  const aids = (s.anketaIds || []).filter(aid => Store.ankety.find(a => a.id === aid));
  if (!aids.length) { toast('Сначала добавьте анкету к опросу'); return; }
  openStudentSurvey(surveyId);
}

function openStudentSurvey(surveyId) {
  currentStudentSurveyId = surveyId;
  currentStudentAnketaId = null;
  goPage('student-survey');
}

function activateStudentCard(id) {
  document.querySelectorAll('#student-survey-wrap .student-q-card').forEach(c => c.classList.remove('active-q'));
  const card = document.getElementById(id);
  if (card) card.classList.add('active-q');
}

function _buildQCard(q, anketaId) {
  let ansHtml = '';
  if (q.type === 'text') {
    ansHtml = `<input id="sq-${q.id}" class="student-ans-line" type="text" placeholder="Краткий ответ">`;
  } else if (q.type === 'paragraph') {
    ansHtml = `<textarea id="sq-${q.id}" class="student-ans-line" rows="3" placeholder="Развёрнутый ответ" style="resize:vertical;height:80px;width:100%"></textarea>`;
  } else if (q.type === 'radio') {
    ansHtml = (q.options||[]).map(opt => `
      <label class="student-opt">
        <input type="radio" name="sq_${q.id}" value="${escHtml(opt)}">
        <span>${escHtml(opt)}</span>
      </label>`).join('');
  } else if (q.type === 'checkbox') {
    ansHtml = (q.options||[]).map(opt => `
      <label class="student-opt">
        <input type="checkbox" name="sq_${q.id}" value="${escHtml(opt)}">
        <span>${escHtml(opt)}</span>
      </label>`).join('');
  }
  return `<div class="student-q-card" id="sqcard-${q.id}" data-anketa-id="${anketaId}" onclick="activateStudentCard('sqcard-${q.id}')">
    <div class="student-q-text">${escHtml(q.text)}${q.required?'<span style="color:#e53935"> *</span>':''}</div>
    ${q.description ? `<div class="student-q-subdesc">${escHtml(q.description)}</div>` : ''}
    ${ansHtml}
  </div>`;
}

function renderStudentSurvey() {
  const survey = Store.surveys.find(x => x.id === currentStudentSurveyId);
  const wrap = document.getElementById('student-survey-wrap');
  if (!wrap) return;

  if (!survey) {
    wrap.innerHTML = `<div class="empty-state"><p>Опрос не найден</p></div>`;
    return;
  }

  const ankety = (survey.anketaIds || [])
    .map(aid => Store.ankety.find(a => a.id === aid))
    .filter(Boolean);

  const multiAnketa = ankety.length > 1;
  const allCards = ankety.map(anketa => {
    const cards = (anketa.questions || []).map(q => _buildQCard(q, anketa.id)).join('');
    const header = multiAnketa
      ? `<div class="student-section-head">${escHtml(anketa.name)}</div>`
      : '';
    return header + (cards || `<div style="color:#9e9e9e;font-size:14px;padding:12px 0">В анкете пока нет вопросов</div>`);
  }).join('');

  const logoSrc = (document.getElementById('sibgiu-logo-img') || {}).src || '';
  wrap.innerHTML = `
    <div class="student-logo-bar">
      ${logoSrc ? `<img src="${logoSrc}" alt="СибГИУ">` : ''}
      <div><div class="sib-name">СибГИУ</div><div class="sib-sub">Система управления качеством</div></div>
    </div>
    <div class="student-header">
      <div class="student-survey-title">${escHtml(survey.title)}</div>
    </div>

    ${ankety.length ? allCards : '<div style="color:#9e9e9e;font-size:14px;text-align:center;padding:20px 0">К опросу не привязано ни одной анкеты</div>'}

    <button class="btn btn-blue" style="width:100%;padding:14px;font-size:15px;margin-top:8px;margin-bottom:32px" onclick="submitStudentSurvey()">
      Отправить ответы
    </button>`;
}

function submitStudentSurvey() {
  const survey = Store.surveys.find(x => x.id === currentStudentSurveyId);
  if (!survey) return;

  const ankety = (survey.anketaIds || [])
    .map(aid => Store.ankety.find(a => a.id === aid))
    .filter(Boolean);

  let firstError = null;
  const newResponses = [];

  for (const anketa of ankety) {
    const answers = {};
    for (const q of (anketa.questions || [])) {
      let val;
      if (q.type === 'text' || q.type === 'paragraph') {
        val = (document.getElementById('sq-' + q.id)?.value || '').trim();
      } else if (q.type === 'radio') {
        const ch = document.querySelector(`input[name="sq_${q.id}"]:checked`);
        val = ch ? ch.value : '';
      } else if (q.type === 'checkbox') {
        val = [...document.querySelectorAll(`input[name="sq_${q.id}"]:checked`)].map(c => c.value);
      }
      answers[q.id] = val;

      const isEmpty = Array.isArray(val) ? !val.length : !val;
      if (q.required && isEmpty) {
        const card = document.getElementById('sqcard-' + q.id);
        if (card) {
          card.style.borderColor = '#e53935';
          card.style.background = '#fff8f8';
          setTimeout(() => { card.style.borderColor = ''; card.style.background = ''; }, 3000);
        }
        if (!firstError) firstError = card;
      }
    }
    newResponses.push({
      id: uid(),
      surveyId: currentStudentSurveyId,
      anketaId: anketa.id,
      participantName: 'Аноним',
      answers,
      submittedAt: Date.now()
    });
  }

  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Заполните все обязательные вопросы');
    return;
  }

  Store.responses = [...Store.responses, ...newResponses];
  renderThankYou();
}

function renderThankYou() {
  const wrap = document.getElementById('student-survey-wrap');
  if (!wrap) return;
  const survey = Store.surveys.find(x => x.id === currentStudentSurveyId);
  wrap.innerHTML = `
    <div style="text-align:center;padding:60px 20px 40px">
      <div style="width:80px;height:80px;background:#e8f5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#43a047" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style="font-size:26px;font-weight:700;color:#212121;margin-bottom:10px">Спасибо!</div>
      <div style="font-size:15px;color:#757575;margin-bottom:8px">Ваши ответы успешно записаны</div>
      ${survey ? `<div style="font-size:13px;color:#9e9e9e;margin-bottom:36px">${escHtml(survey.title)}</div>` : ''}
    </div>`;
}

function startRename(type, id, currentName) {
  document.getElementById('modal-rename-title').textContent = 'Переименовать';
  document.getElementById('modal-rename-input').value = currentName;
  _renameCallback = () => {
    const newName = document.getElementById('modal-rename-input').value.trim();
    if (!newName) { toast('Введите название'); return; }
    if (type === 'anketa') {
      const ankety = Store.ankety;
      const a = ankety.find(x => x.id === id);
      if (a) { a.name = newName; a.dateModified = Date.now(); Store.ankety = ankety; }
      renderAnketyList();
    } else if (type === 'program') {
      const programs = Store.programs;
      const p = programs.find(x => x.id === id);
      if (p) { p.name = newName; p.dateModified = Date.now(); Store.programs = programs; }
      renderPrograms();
    }
    closeModal('modal-rename');
    toast('Переименовано');
  };
  openModal('modal-rename');
}

function confirmRename() { if (_renameCallback) _renameCallback(); }

function confirmDelete(type, id, name) {
  document.getElementById('modal-confirm-title').textContent = 'Удалить?';
  document.getElementById('modal-confirm-text').textContent = `Вы уверены, что хотите удалить «${name}»? Это действие нельзя отменить.`;
  _confirmCallback = () => {
    if (type === 'anketa') {
      Store.ankety = Store.ankety.filter(x => x.id !== id);
      renderAnketyList();
    } else if (type === 'program') {
      Store.programs = Store.programs.filter(x => x.id !== id);
      renderPrograms();
    }
    closeModal('modal-confirm');
    toast('Удалено');
  };
  openModal('modal-confirm');
}

document.getElementById('modal-confirm-ok').onclick = () => { if (_confirmCallback) _confirmCallback(); };

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function unsavedSaveAndLeave() {
  saveAnketa();
  closeModal('modal-unsaved');
  const dest = _pendingNavPage;
  _pendingNavPage = null;
  _editingAnketa = null;
  _pendingStyles = {};
  _activeQId = null;
  goPage(dest);
}

function unsavedDiscardAndLeave() {
  closeModal('modal-unsaved');
  const dest = _pendingNavPage;
  _pendingNavPage = null;
  _editingAnketa = null;
  _pendingStyles = {};
  _activeQId = null;
  _hasUnsavedChanges = false;
  goPage(dest);
}

function unsavedCancel() {
  _pendingNavPage = null;
  closeModal('modal-unsaved');
}

document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target !== ov) return;
    if (ov.id === 'modal-unsaved') { unsavedCancel(); return; }
    ov.classList.remove('open');
  });
});

const _listSort = { ankety: 'name-asc', ssylki: 'name-asc' };

function toggleFilterDropdown(id, btn) {
  const menu = document.getElementById(id);
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.filter-dropdown.open').forEach(m => m.classList.remove('open'));
  if (!isOpen) {
    const r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = r.left + 'px';
    menu.style.right = 'auto';
    menu.classList.add('open');
  }
}

let _dashSort = 'date-desc';

function setDashSort(sort, el) {
  _dashSort = sort;
  el.closest('.filter-dropdown').querySelectorAll('.filter-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.filter-dropdown.open').forEach(m => m.classList.remove('open'));
  renderDashboard();
}

function setListSort(list, sort, el) {
  _listSort[list] = sort;
  el.closest('.filter-dropdown').querySelectorAll('.filter-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.filter-dropdown.open').forEach(m => m.classList.remove('open'));
  if (list === 'ankety') renderAnketyList();
  else renderPrograms();
}

function resetDashFilter() {
  _dashSort = 'date-desc';
  document.querySelectorAll('#filter-dashboard .filter-opt').forEach(o => o.classList.remove('active'));
  document.querySelector('#filter-dashboard .filter-opt')?.classList.add('active');
  document.querySelectorAll('.filter-dropdown.open').forEach(m => m.classList.remove('open'));
  renderDashboard();
}

function resetListFilter(list) {
  _listSort[list] = list === 'ankety' ? 'name-asc' : 'name-asc';
  const dd = document.getElementById('filter-' + (list === 'ankety' ? 'ankety' : 'ssylki'));
  dd.querySelectorAll('.filter-opt').forEach(o => o.classList.remove('active'));
  dd.querySelector('.filter-opt')?.classList.add('active');
  document.querySelectorAll('.filter-dropdown.open').forEach(m => m.classList.remove('open'));
  if (list === 'ankety') renderAnketyList();
  else renderPrograms();
}

function applySort(arr, sort, nameKey) {
  const a = [...arr];
  if (sort === 'name-asc')  return a.sort((x,y) => x[nameKey].localeCompare(y[nameKey],'ru'));
  if (sort === 'name-desc') return a.sort((x,y) => y[nameKey].localeCompare(x[nameKey],'ru'));
  if (sort === 'date-desc') return a.sort((x,y) => (y.dateModified||0) - (x.dateModified||0));
  if (sort === 'date-asc')  return a.sort((x,y) => (x.dateModified||0) - (y.dateModified||0));
  return a;
}

function positionCtxMenu(btn, menu) {
  const r = btn.getBoundingClientRect();
  
  menu.style.visibility = 'hidden';
  menu.style.display = 'block';
  const menuH = menu.offsetHeight;
  menu.style.display = '';
  menu.style.visibility = '';

  menu.style.right = (window.innerWidth - r.right) + 'px';
  menu.style.left = 'auto';

  if (window.innerHeight - r.bottom < menuH + 8) {
    menu.style.top = 'auto';
    menu.style.bottom = (window.innerHeight - r.top + 4) + 'px';
  } else {
    menu.style.bottom = 'auto';
    menu.style.top = (r.bottom + 4) + 'px';
  }
}

function toggleCtx(btn) {
  const menu = btn.nextElementSibling;
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.ctx-menu.open').forEach(m => m.classList.remove('open'));
  if (!isOpen) { positionCtxMenu(btn, menu); menu.classList.add('open'); }
}

function toggleCsel(el) {
  const drop = el.nextElementSibling;
  const isOpen = drop.classList.contains('open');
  document.querySelectorAll('.csel-drop.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.csel.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) {
    const r = el.getBoundingClientRect();
    drop.style.left = r.left + 'px';
    drop.style.minWidth = r.width + 'px';
    drop.style.top = '-9999px';
    drop.style.bottom = '';
    drop.classList.add('open');
    const dh = drop.offsetHeight;
    drop.classList.remove('open');
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < dh + 8 && r.top > dh + 8) {
      drop.style.top = '';
      drop.style.bottom = (window.innerHeight - r.top + 4) + 'px';
    } else {
      drop.style.bottom = '';
      drop.style.top = (r.bottom + 4) + 'px';
    }
    drop.classList.add('open');
    el.classList.add('open');
  }
}

function setCsel(optEl, value, label) {
  const drop    = optEl.closest('.csel-drop');
  const trigger = drop.previousElementSibling;       
  const hidSel  = trigger.previousElementSibling;    
  trigger.querySelector('.csel-val').textContent = label;
  drop.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('active'));
  optEl.classList.add('active');
  drop.classList.remove('open');
  trigger.classList.remove('open');
  hidSel.value = value;
  hidSel.dispatchEvent(new Event('change'));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.col-act')) {
    document.querySelectorAll('.ctx-menu.open').forEach(m => m.classList.remove('open'));
  }
  if (!e.target.closest('.filter-dropdown-wrap')) {
    document.querySelectorAll('.filter-dropdown.open').forEach(m => m.classList.remove('open'));
  }
  if (!e.target.closest('.csel-wrap')) {
    document.querySelectorAll('.csel-drop.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.csel.open').forEach(c => c.classList.remove('open'));
  }
});

function toggleCheckAll(listId, masterCbId) {
  const master = document.getElementById(masterCbId);
  document.querySelectorAll('#' + listId + ' input[type=checkbox]').forEach(cb => cb.checked = master.checked);
}

function showLoginOverlay() {
  const logoSrc = document.getElementById('sibgiu-logo-img');
  const loginLogo = document.getElementById('login-logo-img');
  const loginMobLogo = document.getElementById('login-mob-logo');
  if (logoSrc && loginLogo && !loginLogo.src) loginLogo.src = logoSrc.src;
  if (logoSrc && loginMobLogo && !loginMobLogo.src) loginMobLogo.src = logoSrc.src;
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('app-shell').classList.remove('show');
}

function hideLoginOverlay() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';
  document.getElementById('app-shell').classList.add('show');
  const logoSrc = (document.getElementById('sibgiu-logo-img') || {}).src || '';
  const mobLogo = document.getElementById('mob-logo-img');
  if (mobLogo && logoSrc) mobLogo.src = logoSrc;
  const user = sessionStorage.getItem('sibgiu_auth') || 'admin';
  const mobUser = document.getElementById('mob-user-name');
  if (mobUser) mobUser.textContent = user === 'admin' ? (document.getElementById('header-user') || {}).textContent || 'admin' : user;
}

function doLogin() {
  const login = (document.getElementById('overlay-login-input').value || '').trim();
  const pass  = (document.getElementById('overlay-pass-input').value || '').trim();
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  
  if (login === Store.adminLogin && pass === Store.adminPassword) {
    sessionStorage.setItem('sibgiu_auth', 'admin');
    hideLoginOverlay();
    goPage('dashboard');
    return;
  }

  
  const tokens = Store.accessTokens;
  const token = tokens.find(t => t.login === login && t.password === pass && !t.used);
  if (token) {
    token.used = true;
    token.usedAt = Date.now();
    Store.accessTokens = tokens;
    sessionStorage.setItem('sibgiu_auth', 'participant');
    hideLoginOverlay();
    openStudentSurvey(token.surveyId);
    return;
  }

  errEl.style.display = 'block';
}

function doLogout() {
  sessionStorage.removeItem('sibgiu_auth');
  showLoginOverlay();
}

function generateAccessTokens(surveyId, count) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const rand = (len) => Array.from({length:len}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const newTokens = Array.from({length: count}, (_, i) => ({
    id: 'tok-' + Date.now() + '-' + i,
    surveyId,
    login:    'user-' + rand(5),
    password: rand(8),
    used: false,
    usedAt: null,
    createdAt: Date.now()
  }));
  Store.accessTokens = [...Store.accessTokens, ...newTokens];
  renderSurveyAccess(surveyId);
}

function deleteAccessToken(tokenId) {
  Store.accessTokens = Store.accessTokens.filter(t => t.id !== tokenId);
  const s = Store.surveys.find(x => x.id === currentSurveyId);
  if (s) renderSurveyAccess(s.id);
}

function renderSurveyAccess(surveyId) {
  const tokens = Store.accessTokens.filter(t => t.surveyId === surveyId);
  const cont = document.getElementById('survey-dostup');
  if (!cont) return;

  const baseUrl = window.location.href.split('#')[0];

  cont.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span style="font-size:13px;color:#424242">Сгенерировать</span>
      <input type="number" id="token-count-input" value="5" min="1" max="100" style="width:64px;padding:7px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:13px;outline:none;text-align:center">
      <span style="font-size:13px;color:#424242">кодов</span>
      <button class="btn btn-blue btn-sm" onclick="generateAccessTokens('${surveyId}', +document.getElementById('token-count-input').value||1)">Создать</button>
    </div>
    ${!tokens.length ? `<div class="empty-state"><p>Коды ещё не созданы</p></div>` : `
    <div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:13px;color:#9e9e9e">Всего: ${tokens.length} · Использовано: ${tokens.filter(t=>t.used).length}</span>
      <button class="btn btn-sm" style="border:1.5px solid #e53935;color:#e53935;border-radius:8px;padding:5px 12px;font-size:12px;background:#fff" onclick="if(confirm('Удалить все использованные коды?')){Store.accessTokens=Store.accessTokens.filter(t=>t.surveyId!=='${surveyId}'||!t.used);renderSurveyAccess('${surveyId}')}">Удалить использованные</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
    ${tokens.map(t => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;border:1.5px solid ${t.used?'#e0e0e0':'#e0efff'};background:${t.used?'#fafafa':'#fff'}">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;color:${t.used?'#9e9e9e':'#212121'}">
            <span style="font-family:monospace;font-weight:600">${t.login}</span>
            <span style="color:#9e9e9e;margin:0 6px">/</span>
            <span style="font-family:monospace">${t.password}</span>
          </div>
          ${t.used ? `<div style="font-size:11px;color:#9e9e9e;margin-top:2px">Использован ${fmtDate(t.usedAt)}</div>` : ''}
        </div>
        ${!t.used ? `<button onclick="navigator.clipboard.writeText('${baseUrl}#access=${t.id}').then(()=>toast('Ссылка скопирована'))" style="padding:5px 10px;border:1.5px solid #0078ff;border-radius:8px;background:#fff;color:#0078ff;font-size:12px;cursor:pointer;white-space:nowrap">
          Копировать ссылку
        </button>` : ''}
        <button onclick="deleteAccessToken('${t.id}')" style="padding:5px 8px;border:1.5px solid #e0e0e0;border-radius:8px;background:#fff;color:#e53935;font-size:12px;cursor:pointer">✕</button>
      </div>`).join('')}
    </div>`}
  `;
}

function init() {
  seedData();
  const auth = sessionStorage.getItem('sibgiu_auth');
  if (auth === 'admin') {
    hideLoginOverlay();
    goPage('dashboard');
  } else {
    showLoginOverlay();
    
    const hash = window.location.hash;
    if (hash.startsWith('#access=')) {
      const tokenId = hash.slice(8);
      const token = Store.accessTokens.find(t => t.id === tokenId && !t.used);
      if (token) {
        document.getElementById('overlay-login-input').value = token.login;
        document.getElementById('overlay-pass-input').value = token.password;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

function getSelectedSurveyIds() {
  return [...document.querySelectorAll('.report-check:checked')].map(cb => cb.dataset.id);
}

function updateReportSelection() {
  const all   = document.querySelectorAll('.report-check');
  const checked = document.querySelectorAll('.report-check:checked');
  const master = document.getElementById('reports-check-all');
  const label  = document.getElementById('reports-selected-label');
  if (master) {
    master.checked       = all.length > 0 && checked.length === all.length;
    master.indeterminate = checked.length > 0 && checked.length < all.length;
  }
  if (label) label.textContent = checked.length > 0 ? `Выбрано: ${checked.length} из ${all.length}` : '';
}

function toggleAllReportChecks(master) {
  document.querySelectorAll('.report-check').forEach(cb => cb.checked = master.checked);
  updateReportSelection();
}

function buildReportHTML(forWord) {
  const selectedIds  = getSelectedSurveyIds();
  const allSurveys   = selectedIds.length
    ? Store.surveys.filter(s => selectedIds.includes(s.id))
    : Store.surveys;
  const allResponses = Store.responses;
  const now = new Date().toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric'});

  const surveyBlocks = allSurveys.map(s => {
    const responses  = allResponses.filter(r => r.surveyId === s.id);
    const statusLabel = STATUS_LABELS[s.status] || s.status;
    const anketaNames = (s.anketaIds||[]).map(aid => {
      const a = Store.ankety.find(x => x.id === aid);
      return a ? a.name : null;
    }).filter(Boolean);

    const statsBlocks = (() => {
      const anketaIds = [...new Set(responses.map(r => r.anketaId))];
      if (!anketaIds.length) return '<p style="color:#9e9e9e;font-size:13px">Ответов пока нет</p>';
      return anketaIds.map(aid => {
        const anketa = Store.ankety.find(a => a.id === aid);
        if (!anketa) return '';
        const aResps = responses.filter(r => r.anketaId === aid);
        const qBlocks = anketa.questions.map(q => {
          if (q.type === 'radio' || q.type === 'checkbox') {
            const counts = {};
            (q.options||[]).forEach(o => counts[o] = 0);
            aResps.forEach(r => {
              const ans = r.answers[q.id];
              if (Array.isArray(ans)) ans.forEach(a => { if (counts[a]!==undefined) counts[a]++; });
              else if (ans && counts[ans]!==undefined) counts[ans]++;
            });
            const total = Object.values(counts).reduce((a,b)=>a+b,0)||1;
            const rows = Object.entries(counts).map(([opt,cnt]) => {
              const pct = Math.round(cnt/total*100);
              if (forWord) {
                return `<tr><td style="padding:4px 8px;font-size:12px">${opt}</td><td style="padding:4px 8px;font-size:12px;color:#0078ff;font-weight:600">${cnt}</td><td style="padding:4px 8px;font-size:12px;color:#9e9e9e">${pct}%</td></tr>`;
              }
              return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>${opt}</span><span style="font-weight:600;color:#0078ff">${cnt} (${pct}%)</span></div><div style="height:8px;background:#e0efff;border-radius:4px"><div style="height:100%;width:${pct}%;background:#0078ff;border-radius:4px"></div></div></div>`;
            }).join('');
            if (forWord) {
              return `<p style="font-size:13px;font-weight:600;margin:10px 0 4px">${q.text}</p><table border="1" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial">${rows}</table>`;
            }
            return `<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;margin-bottom:8px">${q.text}</div>${rows}</div>`;
          } else {
            const answers = aResps.map(r => r.answers[q.id]).filter(Boolean);
            if (!answers.length) return '';
            const ansHtml = answers.map(a => `<li style="font-size:12px;color:#424242;margin-bottom:3px">${a}</li>`).join('');
            return `<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;margin-bottom:6px">${q.text}</div><ul style="margin:0;padding-left:16px">${ansHtml}</ul></div>`;
          }
        }).filter(Boolean).join('');
        return `<div style="margin-bottom:16px;padding:12px;background:#f7f9ff;border-radius:8px"><div style="font-size:13px;font-weight:700;color:#0078ff;margin-bottom:10px">${anketa.name} — ${aResps.length} ответов</div>${qBlocks}</div>`;
      }).join('');
    })();

    return `<div style="margin-bottom:28px;padding:20px;border:1.5px solid #e0efff;border-radius:12px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-size:16px;font-weight:700;color:#212121;margin-bottom:4px">${s.title}</div>
          ${anketaNames.length ? `<div style="font-size:12px;color:#757575">Анкеты: ${anketaNames.join(', ')}</div>` : ''}
          <div style="font-size:12px;color:#9e9e9e;margin-top:2px">${fmtDateRange(s.dateStart, s.dateEnd)} · Статус: ${statusLabel}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:26px;font-weight:700;color:#0078ff;line-height:1">${responses.length}</div>
          <div style="font-size:11px;color:#9e9e9e">ответов</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:12px 0">
      ${statsBlocks}
    </div>`;
  }).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;color:#212121">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #0078ff">
        <div>
          <div style="font-size:22px;font-weight:700;color:#0078ff">Отчёт по опросам</div>
          <div style="font-size:12px;color:#9e9e9e;margin-top:2px">СибГИУ · Система управления качеством</div>
        </div>
        <div style="font-size:12px;color:#9e9e9e">Дата: ${now}</div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:24px">
        ${[
          {label:'Всего опросов', value: allSurveys.length},
          {label:'Активных',      value: allSurveys.filter(s=>s.status==='active').length},
          {label:'Всего ответов', value: allResponses.length},
        ].map(c=>`<div style="flex:1;padding:12px 16px;border:1.5px solid #e0efff;border-radius:10px;text-align:center"><div style="font-size:24px;font-weight:700;color:#0078ff">${c.value}</div><div style="font-size:11px;color:#9e9e9e;margin-top:2px">${c.label}</div></div>`).join('')}
      </div>
      ${surveyBlocks || '<p style="color:#9e9e9e;text-align:center">Опросов нет</p>'}
    </div>`;
}

function exportReportPDF() {
  const sel = getSelectedSurveyIds();
  if (!sel.length) { toast('Выберите хотя бы один опрос'); return; }
  const prev = document.getElementById('print-report');
  if (prev) prev.remove();
  const div = document.createElement('div');
  div.id = 'print-report';
  div.innerHTML = buildReportHTML(false);
  document.body.appendChild(div);
  window.print();
  setTimeout(() => div.remove(), 1000);
}

function exportReportWord() {
  const sel = getSelectedSurveyIds();
  if (!sel.length) { toast('Выберите хотя бы один опрос'); return; }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>body{font-family:Arial,sans-serif;margin:40px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px}</style>
  </head><body>${buildReportHTML(true)}</body></html>`;
  const blob = new Blob(['\ufeff' + html], {type:'application/msword'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `отчёт_${new Date().toLocaleDateString('ru-RU').replace(/\./g,'-')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}