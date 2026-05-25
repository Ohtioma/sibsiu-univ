const _IS_SERVER = (location.protocol === 'http:' || location.protocol === 'https:') && location.port !== '';
const _SERVER_KEYS = ['surveys', 'ankety', 'programs', 'responses', 'accessTokens', 'studentGroups', 'surveyLinks'];
function _syncToServer(key, val) {
  if (!_IS_SERVER) return;
  fetch('/api/data/' + key, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: val })
  }).catch(() => {});
}
async function _loadFromServer() {
  if (!_IS_SERVER) return;
  try {
    const data = await fetch('/api/data').then(r => r.json());
    for (const key of _SERVER_KEYS) {
      const serverVal = data[key];
      if (serverVal === undefined) continue;
      if (Array.isArray(serverVal) && serverVal.length === 0) {
        if (key === 'studentGroups') {
          try {
            const oldGroups = JSON.parse(localStorage.getItem('sib_groups'));
            if (oldGroups && typeof oldGroups === 'object' && Object.keys(oldGroups).length > 0) {
              const migrated = [];
              for (const [programName, gs] of Object.entries(oldGroups)) {
                for (const g of (gs || [])) {
                  migrated.push({ id: uid(), programName, name: g.name, count: g.count });
                }
              }
              if (migrated.length > 0) {
                _syncToServer('studentGroups', migrated);
                localStorage.setItem('sib_studentGroups', JSON.stringify(migrated));
                continue;
              }
            }
          } catch(e) {}
        }
        try {
          const localVal = JSON.parse(localStorage.getItem('sib_' + key));
          if (Array.isArray(localVal) && localVal.length > 0) {
            _syncToServer(key, localVal);
            continue;
          }
        } catch(e) {}
      }
      localStorage.setItem('sib_' + key, JSON.stringify(serverVal));
    }
  } catch(e) {}
}
const Store = {
  _get(key) {
    try { return JSON.parse(localStorage.getItem('sib_' + key)); }
    catch(e) { return null; }
  },
  _set(key, val) {
    localStorage.setItem('sib_' + key, JSON.stringify(val));
    _syncToServer(key, val);
  },
  get surveys()   { return this._get('surveys')   || []; },
  set surveys(v)  { this._set('surveys', v); },
  get ankety()    { return this._get('ankety')    || []; },
  set ankety(v)   { this._set('ankety', v); },
  get programs()  { return this._get('programs')  || []; },
  set programs(v) { this._set('programs', v); },
  get responses() { return this._get('responses') || []; },
  set responses(v){ this._set('responses', v); },
  get adminLogin()     { return localStorage.getItem('sibgiu_admin_login') || 'admin'; },
  get adminPassword()  { return localStorage.getItem('sibgiu_admin_pass')  || 'admin'; },
  get accessTokens()   { try { return JSON.parse(localStorage.getItem('sibgiu_access_tokens') || '[]'); } catch(e) { return []; } },
  set accessTokens(v)  {
    localStorage.setItem('sibgiu_access_tokens', JSON.stringify(v));
    _syncToServer('accessTokens', v);
  },
  get groups() {
    const arr = this._get('studentGroups') || [];
    const map = {};
    for (const g of arr) {
      if (!map[g.programName]) map[g.programName] = [];
      map[g.programName].push({ name: g.name, count: g.count });
    }
    return map;
  },
  set groups(v) {
    const arr = [];
    for (const [programName, gs] of Object.entries(v || {})) {
      for (const g of (gs || [])) {
        const existing = (this._get('studentGroups') || []).find(x => x.programName === programName && x.name === g.name);
        arr.push({ id: existing ? existing.id : uid(), programName, name: g.name, count: g.count });
      }
    }
    this._set('studentGroups', arr);
  },
  get surveyLinks() { return this._get('surveyLinks') || []; },
  set surveyLinks(v){ this._set('surveyLinks', v); },
};
function uid() { return '_' + Math.random().toString(36).substr(2, 9); }
function _slug(name) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
    'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
  };
  return (name || '').toLowerCase().split('').map(c => map[c] !== undefined ? map[c] : (/[a-z0-9]/.test(c) ? c : '')).join('');
}
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
function ensurePrograms() {
  const BUILTIN = [
    {code:'1.2.2',dir:'Математическое моделирование, численные методы и комплексы программ',prog:''},
    {code:'08.06.01',dir:'Техника и технологии строительства',prog:'Строительные конструкции, здания и сооружения'},
    {code:'08.06.01',dir:'Техника и технологии строительства',prog:'Строительные материалы и изделия'},
    {code:'21.06.01',dir:'Геология, разведка и разработка полезных ископаемых',prog:'Геотехнология'},
    {code:'1.3.8',dir:'Физика конденсированного состояния',prog:''},
    {code:'2.4.2',dir:'Электротехнические комплексы и системы',prog:''},
    {code:'2.5.8',dir:'Сварка, родственные процессы и технологии',prog:''},
    {code:'2.6.2',dir:'Металлургия черных, цветных и редких металлов',prog:''},
    {code:'2.3.3',dir:'Автоматизация и управление технологическими процессами и производствами',prog:''},
    {code:'2.3.4',dir:'Управление в организационных системах',prog:''},
    {code:'2.5.22',dir:'Управление качеством продукции. Стандартизация. Организация производства',prog:''},
    {code:'5.2.3',dir:'Региональная и отраслевая экономика',prog:''},
    {code:'2.1.5',dir:'Строительные материалы и изделия',prog:''},
    {code:'2.5.21',dir:'Машины, агрегаты и технологические процессы',prog:''},
    {code:'2.6.1',dir:'Металловедение и термическая обработка металлов и сплавов',prog:''},
    {code:'2.6.17',dir:'Материаловедение',prog:''},
    {code:'2.8.6',dir:'Геомеханика, разрушение горных пород, рудничная аэрогазодинамика и горная теплофизика',prog:''},
    {code:'1.6.21',dir:'Геоэкология',prog:''},
    {code:'2.6.4',dir:'Обработка металлов давлением',prog:''},
    {code:'2.8.8',dir:'Геотехнология, горные машины',prog:''},
    {code:'2.9.1',dir:'Транспортные и транспортно-технологические системы страны, ее регионов и городов, организация производства на транспорте',prog:''},
    {code:'21.05.02',dir:'Прикладная геология',prog:'Геологическая съемка, поиски и разведка месторождений твердых полезных ископаемых'},
    {code:'21.05.04',dir:'Горное дело',prog:'Подземная разработка пластовых месторождений'},
    {code:'21.05.04',dir:'Горное дело',prog:'Электромеханика и информационные системы в горном производстве'},
    {code:'21.05.04',dir:'Горное дело',prog:'Открытые горные работы'},
    {code:'21.05.04',dir:'Горное дело',prog:'Электрификация и автоматизация горного производства'},
    {code:'15.03.04',dir:'Автоматизация технологических процессов и производств',prog:'Автоматизация технологических процессов и производств'},
    {code:'09.03.02',dir:'Информационные системы и технологии',prog:'Информационные системы и технологии'},
    {code:'09.03.02',dir:'Информационные системы и технологии',prog:'Разработка и эксплуатация информационных систем и технологий'},
    {code:'27.01.01',dir:'Контролер измерительных приборов 11',prog:'Контроль измерительных приборов'},
    {code:'22.03.02',dir:'Металлургия',prog:'Металлургия (трек Инновационное производство стали и сплавов)'},
    {code:'22.03.02',dir:'Металлургия',prog:'Металлургия (трек: Обработка металлов давлением)'},
    {code:'15.03.01',dir:'Машиностроение',prog:'Оборудование и технология сварочного производства'},
    {code:'22.03.02',dir:'Металлургия',prog:'Металлургия черных металлов'},
    {code:'22.03.02',dir:'Металлургия',prog:'Обработка металлов давлением'},
    {code:'44.03.01',dir:'Педагогическое образование',prog:'Дошкольное образование'},
    {code:'44.03.01',dir:'Педагогическое образование',prog:'Физическая культура'},
    {code:'13.03.01',dir:'Теплоэнергетика и теплотехника',prog:'Промышленная теплоэнергетика'},
    {code:'15.03.02',dir:'Технологические машины и оборудование',prog:'Металлургические машины и оборудование'},
    {code:'15.03.02',dir:'Технологические машины и оборудование',prog:'Цифровой инжиниринг (Металлургические машины и оборудование)'},
    {code:'15.03.02',dir:'Технологические машины и оборудование',prog:'Цифровой инжиниринг (Оборудование и технология сварочного производства)'},
    {code:'23.03.01',dir:'Технология транспортных процессов',prog:'Интеллектуальные транспортные системы в дорожном движении'},
    {code:'23.03.01',dir:'Технология транспортных процессов',prog:'Технология транспортных процессов'},
    {code:'23.03.01',dir:'Технология транспортных процессов',prog:'Организация перевозок и управление на автомобильном транспорте'},
    {code:'27.03.02',dir:'Управление качеством',prog:'Управление производственными системами'},
    {code:'13.03.02',dir:'Электроэнергетика и электротехника',prog:'Электроэнергетика и электротехника'},
    {code:'23.05.04',dir:'Эксплуатация железных дорог',prog:'Промышленный транспорт'},
    {code:'15.03.04',dir:'Автоматизация технологических процессов и производств',prog:'Автоматизированные системы управления технологическими процессами и производствами'},
    {code:'15.04.04',dir:'Автоматизация технологических процессов и производств',prog:'Автоматизация технологических процессов и производств'},
    {code:'15.04.04',dir:'Автоматизация технологических процессов и производств',prog:'Автоматизированные системы управления технологическими процессами и производствами'},
    {code:'09.03.01',dir:'Информатика и вычислительная техника',prog:'Информатика и вычислительная техника'},
    {code:'09.03.01',dir:'Информатика и вычислительная техника',prog:'Программная инженерия'},
    {code:'09.04.01',dir:'Информатика и вычислительная техника',prog:'Программная инженерия'},
    {code:'09.03.03',dir:'Прикладная информатика',prog:'Прикладная информатика'},
    {code:'09.03.03',dir:'Прикладная информатика',prog:'Искусственный интеллект и машинное обучение'},
    {code:'09.04.03',dir:'Прикладная информатика',prog:'Прикладная информатика'},
    {code:'01.03.02',dir:'Прикладная математика и информатика',prog:'Прикладная математика и информатика'},
    {code:'01.03.02',dir:'Прикладная математика и информатика',prog:'Математическое моделирование и интеллектуальный анализ данных'},
    {code:'11.03.04',dir:'Электроника и наноэлектроника',prog:'Промышленная электроника'},
    {code:'13.04.02',dir:'Электроэнергетика и электротехника',prog:'Автоматизированные электромеханические комплексы и системы'},
    {code:'15.02.14',dir:'Оснащение средствами автоматизации технологических процессов и производств (по отраслям)',prog:''},
    {code:'09.02.07',dir:'Информационные системы и программирование',prog:''},
    {code:'27.02.06',dir:'Контроль работы измерительных приборов',prog:''},
    {code:'18.02.12',dir:'Технология аналитического контроля химических соединений',prog:''},
    {code:'15.02.10',dir:'Мехатроника и мобильная робототехника (по отраслям)',prog:''},
    {code:'21.02.17',dir:'Подземная разработка месторождений полезных ископаемых',prog:''},
    {code:'21.02.17',dir:'Подземная разработка месторождений полезных ископаемых',prog:'Подземная разработка месторождений полезных ископаемых'},
    {code:'15.02.10',dir:'Мехатроника и робототехника (по отраслям)',prog:'Мехатроника и робототехника'},
    {code:'11.02.16',dir:'Монтаж, техническое обслуживание и ремонт электронных приборов и устройств',prog:''},
    {code:'09.01.03',dir:'Оператор информационных систем и ресурсов',prog:'Работа в системах электронного документооборота'},
    {code:'15.02.11',dir:'Техническая эксплуатация и обслуживание роботизированного производства',prog:''},
    {code:'15.02.12',dir:'Монтаж,техническое обслуживание и ремонт промышленного оборудования (по отраслям)',prog:''},
    {code:'15.02.13',dir:'Техническое обслуживание и ремонт систем вентиляции и кондиционирования',prog:''},
    {code:'08.02.13',dir:'Монтаж и эксплуатация внутренних сантехнических устройств, кондиционирования воздуха и вентиляции',prog:'Монтаж и техническое обслуживание инженерных систем отопления, водоснабжения, водоотведения и систем вентиляции, кондиционирования воздуха гражданских зданий'},
    {code:'09.02.06',dir:'Сетевое и системное администрирование',prog:''},
    {code:'09.02.06',dir:'Сетевое и системное администрирование',prog:'Сетевое и системное администрирование'},
    {code:'15.02.15',dir:'Технология металлообрабатывающего производства',prog:''},
    {code:'15.02.16',dir:'Технология машиностроения',prog:'Технология машиностроения'},
    {code:'27.02.07',dir:'Управление качеством продукции, процессов и услуг (по отраслям)',prog:''},
    {code:'27.02.07',dir:'Управление качеством продукции, процессов и услуг (по отраслям)',prog:'Управление качеством продукции, процессов и услуг'},
    {code:'15.02.17',dir:'Монтаж, техническое обслуживание, эксплуатация и ремонт промышленного оборудования (по отраслям)',prog:'Ремонт промышленного оборудования'},
    {code:'15.02.18',dir:'Техническая эксплуатация и обслуживание роботизированного производства (по отраслям)',prog:'Техническая эксплуатация и обслуживание роботизированного производства'},
    {code:'22.03.02',dir:'Металлургия',prog:'Металлургия (трек: Инновационное производство стали и сплавов)'},
    {code:'22.04.02',dir:'Металлургия',prog:'Металлургия'},
    {code:'22.03.01',dir:'Материаловедение и технологии материалов',prog:'Материаловедение и технологии конструкционных и функциональных материалов'},
    {code:'20.04.01',dir:'Техносферная безопасность',prog:'Инженерная защита окружающей среды'},
    {code:'13.04.01',dir:'Теплоэнергетика и теплотехника',prog:'Промышленная теплоэнергетика'},
    {code:'18.04.01',dir:'Химическая технология',prog:'Химическая технология неорганических веществ'},
    {code:'05.04.06',dir:'Экология и природопользование',prog:'Ресурсосбережение и утилизация отходов'},
    {code:'53.02.02',dir:'Музыкальное искусство эстрады (по видам)',prog:''},
    {code:'20.03.01',dir:'Техносферная безопасность',prog:'Инженерная защита окружающей среды'},
    {code:'20.03.01',dir:'Техносферная безопасность',prog:'Инженерная защита окружающей среды и природоподобные технологии'},
    {code:'18.03.01',dir:'Химическая технология',prog:'Химическая технология неорганических веществ'},
    {code:'22.03.02',dir:'Металлургия',prog:'Цифровая металлургия'},
    {code:'22.03.02',dir:'Металлургия',prog:'Металлургия цветных, редких и благородных металлов'},
    {code:'05.03.06',dir:'Экология и природопользование',prog:'Экология'},
    {code:'05.03.06',dir:'Экология и природопользование',prog:'Геоэкология и эффективное управление природными ресурсами'},
    {code:'09.01.03',dir:'Оператор информационных систем и ресурсов 11',prog:'Работа в системах электронного документооборота'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'География и иностранный язык (английский язык)'},
    {code:'27.01.01',dir:'Контролер измерительных приборов 9',prog:'Контроль измерительных приборов'},
    {code:'15.03.05',dir:'Конструкторско-технологическое обеспечение машиностроительных производств',prog:'Инновационные технологии в машиностроении'},
    {code:'15.03.01',dir:'Машиностроение',prog:'Цифровой инжиниринг'},
    {code:'15.03.01',dir:'Машиностроение',prog:'Менеджмент производственных систем в машиностроении'},
    {code:'22.03.02',dir:'Металлургия',prog:'Цифровая металлургия (Сталеплавильное производство)'},
    {code:'22.03.02',dir:'Металлургия',prog:'Цифровой инжиниринг (Обработка металлов давлением)'},
    {code:'22.03.02',dir:'Металлургия',prog:'Цифровая металлургия (трек Обработка металлов давлением)'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'История и Право'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Информатика и Образовательная робототехника'},
    {code:'15.04.02',dir:'Технологические машины и оборудование',prog:'Технологические машины и оборудование'},
    {code:'23.04.01',dir:'Технология транспортных процессов',prog:'Организация перевозок и управление на транспорте'},
    {code:'23.03.01',dir:'Технология транспортных процессов',prog:'Автомобили и автомобильное хозяйство'},
    {code:'13.03.01',dir:'Теплоэнергетика и теплотехника',prog:'Цифровой инжиниринг'},
    {code:'13.03.02',dir:'Электроэнергетика и электротехника',prog:'Цифровой инжиниринг'},
    {code:'23.03.03',dir:'Эксплуатация транспортно-технологических машин и комплексов',prog:'Автомобили и автомобильное хозяйство'},
    {code:'23.03.03',dir:'Эксплуатация транспортно-технологических машин и комплексов',prog:'Автомобильное хозяйство и автомобильный сервис'},
    {code:'27.03.02',dir:'Управление качеством',prog:'Стандартизация и сертификация'},
    {code:'27.04.02',dir:'Управление качеством',prog:'Операционный менеджмент'},
    {code:'27.04.02',dir:'Управление качеством',prog:'Бережливое производство'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Математика и физика'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Математика и Цифровые технологии в образовании'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Начальное образование и иностранный язык (английский язык)'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Обществознание и Экономическое образование'},
    {code:'44.04.01',dir:'Педагогическое образование',prog:'Теория и методика обучения и воспитания'},
    {code:'44.04.01',dir:'Педагогическое образование',prog:'Управление образованием'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Русский язык и дополнительное образование (журналистика)'},
    {code:'44.03.05',dir:'Педагогическое образование (с двумя профилями подготовки)',prog:'Русский язык и иностранный язык (английский язык)'},
    {code:'44.03.01',dir:'Педагогическое образование',prog:'Физика'},
    {code:'08.03.01',dir:'Строительство',prog:'Информационное моделирование зданий и сооружений'},
    {code:'08.03.01',dir:'Строительство',prog:'Инженерные системы жизнеобеспечения в строительстве'},
    {code:'08.03.01',dir:'Строительство',prog:'Промышленное и гражданское строительство'},
    {code:'07.03.01',dir:'Архитектура',prog:'Архитектура'},
    {code:'07.04.01',dir:'Архитектура',prog:'Архитектура'},
    {code:'08.04.01',dir:'Строительство',prog:'Строительство'},
    {code:'08.05.01',dir:'Строительство уникальных зданий и сооружений',prog:'Строительство высотных и большепролетных зданий и сооружений'},
    {code:'09.03.02',dir:'Информационные системы и технологии',prog:'Экономика и аналитика интеллектуального бизнеса'},
    {code:'38.04.02',dir:'Менеджмент',prog:'Производственный менеджмент'},
    {code:'38.03.02',dir:'Менеджмент',prog:'Менеджмент организации'},
    {code:'38.04.01',dir:'Экономика',prog:'Бизнес-планирование и управление инвестиционными проектами'},
    {code:'38.03.01',dir:'Экономика',prog:'Экономика и устойчивое развитие'},
    {code:'22.03.02',dir:'Металлургия',prog:'Экономика и управление на предприятиях в металлургии'},
    {code:'49.02.01',dir:'Физическая культура',prog:'Физическая культура'},
    {code:'38.03.01',dir:'Экономика',prog:'Экономика и инвестиции в организации'},
    {code:'38.03.01',dir:'Экономика',prog:'Экономика и управление в организации'},
    {code:'43.02.16',dir:'Туризм и гостеприимство',prog:'Туроператорские и турагентские услуги'},
    {code:'38.03.03',dir:'Управление персоналом',prog:'Управление персоналом организации'},
    {code:'38.02.01',dir:'Экономика и бухгалтерский учет (по отраслям)',prog:''},
    {code:'38.02.01',dir:'Экономика и бухгалтерский учет (по отраслям)',prog:'Экономика и бухгалтерский учет коммерческой организации'},
  ];
  const existing = Store.programs;
  const existingKeys = new Set(existing.map(p => p.code + '|' + p.name + '|' + (p.programName||'')));
  const toAdd = BUILTIN.filter(p => !existingKeys.has(p.code + '|' + p.dir + '|' + p.prog));
  if (toAdd.length > 0) {
    Store.programs = [
      ...toAdd.map(p => ({ id: uid(), code: p.code, name: p.dir, programName: p.prog, dateModified: Date.now() })),
      ...existing
    ];
  }
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
const PAGES = ['dashboard','survey-detail','ankety','anketa-editor','otchety','student-survey'];
const NAV_MAP = {
  'dashboard':      'nav-oprosy',
  'survey-detail':  'nav-oprosy',
  'ankety':         'nav-ankety',
  'anketa-editor':  'nav-ankety',
  'otchety':        'nav-otchety',
  'student-survey': null,
};
const SEARCH_PAGES = [];
const NOTITLE_PAGES = [];
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
    'otchety': 'mob-nav-otchety'
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
  const pageLabels = { ankety: 'Анкеты' };
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
  if (id === 'otchety')         renderReports();
  if (id === 'student-survey')  renderStudentSurvey();
}
function onHeaderSearch() {
  const activePage = PAGES.find(p => document.getElementById('page-'+p)?.classList.contains('active'));
  if (activePage === 'ankety')  renderAnketyList();
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
    const respCount = Store.surveyLinks
      .filter(l => l.surveyId === s.id)
      .reduce((sum, l) => sum + (l.usedCount || 0), 0);
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
  const inp = document.getElementById(inputId);
  if (inp) inp.value = value;
  const drop = optEl.closest('.csel-drop');
  const trigger = inp && inp.nextElementSibling && inp.nextElementSibling.querySelector('.csel');
  if (trigger) {
    trigger.querySelector('.csel-val').textContent = label || value;
    trigger.classList.remove('open');
  }
  drop.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('active'));
  optEl.classList.add('active');
  drop.classList.remove('open');
}
function sfSync(inputId, value) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.value = value;
  const wrap = inp.nextElementSibling;
  if (!wrap) return;
  const trigger = wrap.querySelector('.csel');
  const drop = wrap.querySelector('.csel-drop');
  if (!trigger || !drop) return;
  const label = _sfLabels[value] || value;
  const valEl = trigger.querySelector('.csel-val');
  if (valEl) valEl.textContent = label;
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
  const todayStr = today();
  document.getElementById('sf-datestart').min   = todayStr;
  document.getElementById('sf-dateend').min     = todayStr;
  document.getElementById('sf-datestart').value  = todayStr;
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
  const todayStr = today();
  document.getElementById('sf-datestart').min   = todayStr;
  document.getElementById('sf-dateend').min     = todayStr;
  document.getElementById('sf-datestart').value = s.dateStart || '';
  document.getElementById('sf-dateend').value   = s.dateEnd   || '';
  openModal('modal-survey-form');
}
function saveSurveyForm() {
  const title = document.getElementById('sf-title').value.trim();
  if (!title) { toast('Введите название опроса'); return; }
  const todayStr = today();
  const dateStart = document.getElementById('sf-datestart').value;
  const dateEnd   = document.getElementById('sf-dateend').value;
  if (dateStart && dateStart < todayStr) { toast('Дата начала не может быть в прошлом'); return; }
  if (dateEnd   && dateEnd   < todayStr) { toast('Дата окончания не может быть в прошлом'); return; }
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
    surveys.unshift({ id: uid(), ...data, anketaIds: [], programIds: [], groups: data.category ? [data.category] : [], createdAt: Date.now() });
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
  if (document.getElementById('modal-add-program-survey').classList.contains('open')) {
    renderModalProgramList();
  } else {
    renderPrograms();
  }
}
function cancelCreateProgram() {
  closeModal('modal-create-program');
  if (document.getElementById('modal-add-program-survey').classList.contains('open')) {
  }
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
  if (pane === 'stat') renderSurveyStat(currentSurveyId);
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
      <div class="cl-text"><strong>${escHtml(p.name)}</strong><small>${escHtml(p.code)} · ${escHtml(p.programName || p.name)}</small></div>
      <button style="margin-left:auto;color:#e53935;background:none;border:none;cursor:pointer;font-size:12px" onclick="removeProgramFromSurvey('${pid}')">Убрать</button>
    </li>`;
  }).join('') || `<li class="cl-empty">${q ? 'Ничего не найдено' : 'Программы не добавлены'}</li>`;
  const statusLabel = STATUS_LABELS[s.status] || s.status;
  const respCount = Store.surveyLinks
    .filter(l => l.surveyId === s.id)
    .reduce((sum, l) => sum + (l.usedCount || 0), 0);
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
            ${['Обучающиеся','Преподаватели','Сотрудники','Гости','Работодатели'].map(c=>`
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
  const s = Store.surveys.find(x => x.id === currentSurveyId);
  _modalProgramIds = new Set(s ? (s.programIds || []) : []);
  document.getElementById('modal-prog-search').value = '';
  renderModalProgramList();
  openModal('modal-add-program-survey');
}
function toggleModalProgram(pid) {
  if (_modalProgramIds.has(pid)) _modalProgramIds.delete(pid);
  else _modalProgramIds.add(pid);
}
function renderModalProgramList() {
  const q = document.getElementById('modal-prog-search').value.toLowerCase();
  const s = Store.surveys.find(x => x.id === currentSurveyId);
  const progs = Store.programs.filter(p => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  document.getElementById('modal-prog-list').innerHTML = progs.map(p => {
    const linked = _modalProgramIds.has(p.id);
    return `<div class="modal-item">
      <input type="checkbox" id="mp-${p.id}" ${linked?'checked':''} data-pid="${p.id}" onchange="toggleModalProgram('${p.id}')">
      <div class="modal-item-text"><strong>${escHtml(p.name)}</strong><small>${escHtml(p.code)} · ${escHtml(p.programName || p.name)}</small></div>
    </div>`;
  }).join('') || '<p style="color:#9e9e9e;padding:8px 0">Программы не найдены</p>';
}
function confirmAddProgram() {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.programIds = [..._modalProgramIds]; Store.surveys = surveys; }
  closeModal('modal-add-program-survey');
  renderSurveyOpros(s);
  if (currentSurveyTab === 'nastroyki') renderSurveyNastroyki(s);
  if (currentSurveyTab === 'dostup') renderSurveyAccess(s.id);
  toast('Программы обновлены');
}
function removeProgramFromSurvey(pid) {
  const surveys = Store.surveys;
  const s = surveys.find(x => x.id === currentSurveyId);
  if (s) { s.programIds = (s.programIds||[]).filter(x => x !== pid); Store.surveys = surveys; }
  renderSurveyOpros(s);
  if (currentSurveyTab === 'nastroyki') renderSurveyNastroyki(s);
  if (currentSurveyTab === 'dostup') renderSurveyAccess(s.id);
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
  const drop = el.closest('.csel-drop');
  const trigger = drop._cselTrigger || drop.previousElementSibling;
  if (trigger) { const v = trigger.querySelector('.csel-val'); if (v) v.textContent = label; trigger.classList.remove('open'); }
  drop.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  drop.classList.remove('open');
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
  const qs = Object.assign({}, q.style || {}, _pendingStyles[q.id] || {});
  const wMap = {'Bold':'700','Medium':'500','Regular':'400','Italic':'400'};
  const optStyleStr = [
    qs.fontFamily ? `font-family:${qs.fontFamily}` : '',
    wMap[qs.fontStyle] ? `font-weight:${wMap[qs.fontStyle]}` : '',
    (qs.fontStyle==='Italic'||qs.italic) ? 'font-style:italic' : '',
    qs.fontSize ? `font-size:${qs.fontSize}px` : '',
    qs.fontColor ? `color:${qs.fontColor}` : '',
  ].filter(Boolean).join(';');
  const optInputStyle = `border:none;border-bottom:1px solid #e0e0e0;outline:none;font-size:14px;flex:1;background:transparent${optStyleStr ? ';' + optStyleStr : ''}`;
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
        <input type="text" value="${escHtml(opt)}" class="q-opt-text" style="${optInputStyle}"
          onchange="updateOption('${q.id}',${oi},this.value)">
        <button style="color:#9e9e9e;background:none;border:none;cursor:pointer;font-size:16px;line-height:1" onclick="removeOption('${q.id}',${oi})">×</button>
      </div>`).join('');
    ansArea = `<div class="q-opts" id="opts-${q.id}">${opts}
      <button class="add-opt-btn" onclick="addOption('${q.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0078ff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Добавить вариант
      </button></div>`;
  }
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
  if (ffEl) {
    ffEl.value = s.fontFamily||'Helvetica';
    const ffV = ffEl.nextElementSibling?.querySelector('.csel-val');
    if (ffV) ffV.textContent = s.fontFamily||'Helvetica';
  }
  const fsEl = document.getElementById('ep-font-style');
  if (fsEl) {
    fsEl.value = s.fontStyle||'Regular';
    const fsV = fsEl.nextElementSibling?.querySelector('.csel-val');
    if (fsV) fsV.textContent = s.fontStyle||'Regular';
  }
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
  document.querySelectorAll('#qcard-' + qId + ' .q-opt-text').forEach(el => {
    el.style.fontFamily = s.fontFamily || '';
    el.style.fontWeight = wMap[s.fontStyle] || '400';
    el.style.fontStyle = (s.fontStyle === 'Italic' || s.italic) ? 'italic' : 'normal';
    if (s.fontSize) el.style.fontSize = s.fontSize + 'px';
    el.style.color = s.fontColor || '';
  });
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
        <small>${escHtml(p.code)} · ${escHtml(p.programName || p.name)}</small>
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
    const sActiveLinkIds = new Set(Store.surveyLinks.filter(l => l.surveyId === s.id).map(l => l.id));
    const responses = allResponses.filter(r => r.surveyId === s.id && sActiveLinkIds.has(r.linkId));
    const passCount = Store.surveyLinks.filter(l => l.surveyId === s.id).reduce((sum, l) => sum + (l.usedCount || 0), 0);
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
            <div style="font-size:28px;font-weight:700;color:#0078ff;line-height:1">${passCount}</div>
            <div style="font-size:11px;color:#9e9e9e">ответов</div>
          </div>
          <svg id="report-chev-${s.id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .25s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div id="report-body-${s.id}" data-open="0" style="max-height:0;overflow:hidden;opacity:0;transition:max-height .3s ease,opacity .25s ease">
        <div style="padding-top:12px">
          ${responses.length ? buildResponseStats(s, responses) : `<div style="color:#9e9e9e;font-size:13px;padding:12px 0">Ответов пока нет</div>`}
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
function exportReport(surveyId, format) {
  const s = Store.surveys.find(x => x.id === surveyId);
  if (!s) return;
  const activeLinkIds = new Set(Store.surveyLinks.filter(l => l.surveyId === surveyId).map(l => l.id));
  const allResponses = Store.responses.filter(r => r.surveyId === surveyId && activeLinkIds.has(r.linkId));
  const ankety = (s.anketaIds || []).map(aid => Store.ankety.find(a => a.id === aid)).filter(Boolean);
  const programs = (s.programIds || []).map(pid => Store.programs.find(p => p.id === pid)).filter(Boolean);
  const year = s.dateEnd ? new Date(s.dateEnd).getFullYear() : new Date().getFullYear();
  const categoryMap = { 'Обучающиеся':'обучающихся','Преподаватели':'преподавателей','Сотрудники':'сотрудников','Гости':'гостей' };
  const categoryGen = categoryMap[s.category] || (s.category||'обучающихся').toLowerCase();
  const mainProgram = programs[0];
  const multiplePrograms = programs.length > 1;
  const programTitle = multiplePrograms
    ? '«Нескольким образовательным программам»'
    : mainProgram ? `«${escHtml(mainProgram.name)}»` : `«${escHtml(s.title)}»`;
  const programCode = multiplePrograms
    ? ''
    : mainProgram ? `(${escHtml(mainProgram.code)} ${escHtml(mainProgram.programName)})` : '';
  const programsListHtml = multiplePrograms
    ? `<div class="section-label">Образовательные программы</div><p style="font-size:14pt;line-height:1.6">${programs.map(p => `${escHtml(p.code)} ${escHtml(p.name)}${p.programName ? ' — ' + escHtml(p.programName) : ''}`).join(',<br>')}</p>`
    : '';
  const allQuestions = [];
  ankety.forEach(anketa => {
    anketa.questions.forEach(q => {
      allQuestions.push({ q, anketa, responses: allResponses.filter(r => r.anketaId === anketa.id) });
    });
  });
  const questionsRows = allQuestions.map(({ q }, i) => {
    const opts = (q.options||[]).map((o, oi) => `Вариант ${oi+1}: ${escHtml(o)}`).join('<br>');
    return `<tr><td>${i+1}</td><td>${escHtml(q.text)}${q.required?'*':''}</td><td>${opts||'Свободная форма ответа'}</td></tr>`;
  }).join('');
  let totalScore = 0, scoredCount = 0;
  const resultsRows = allQuestions.map(({ q, responses }, i) => {
    if (q.type !== 'radio' && q.type !== 'checkbox') return null;
    if (!q.options || !q.options.length) return null;
    let score = '';
    if (responses.length > 0) {
      const counts = {};
      q.options.forEach(o => counts[o] = 0);
      responses.forEach(r => {
        const ans = r.answers[q.id];
        if (Array.isArray(ans)) ans.forEach(a => { if (counts[a]!==undefined) counts[a]++; });
        else if (ans && counts[ans]!==undefined) counts[ans]++;
      });
      let wSum = 0, total = 0;
      q.options.forEach((o, oi) => {
        const pts = Math.max(1, 5 - oi);
        wSum += pts * counts[o];
        total += counts[o];
      });
      if (total > 0) { score = (wSum / total).toFixed(1); totalScore += parseFloat(score); scoredCount++; }
    }
    return `<tr><td>${i+1}</td><td>${escHtml(q.text)}${q.required?'*':''}</td><td style="text-align:center">${score||'—'}</td></tr>`;
  }).filter(Boolean).join('');
  const avgScore = scoredCount > 0 ? (totalScore/scoredCount).toFixed(1) : '—';
  const freeTextQs = allQuestions.filter(({q}) => q.type !== 'radio' && q.type !== 'checkbox');
  const freeTextHtml = freeTextQs.map(({q}, _, arr) => {
    const num = allQuestions.findIndex(x => x.q.id === q.id) + 1;
    return `<p class="freetext-para">Вопрос № ${num} «${escHtml(q.text)}» предоставил возможность ${categoryGen} внести предложения по улучшению качества образовательного процесса в целом и отдельных дисциплин и практик в СибГИУ. Ответы на данный вопрос были представлены в свободной форме и позволили определить возможности для улучшения качества образовательного процесса в целом и отдельных дисциплин и практик в СибГИУ.</p>`;
  }).join('');
  const progListInline = '(' + programs.map(p => `${escHtml(p.code)} ${escHtml(p.name)}${p.programName ? ' &mdash; ' + escHtml(p.programName) : ''}`).join('<br>') + ')';
  const subtitleHtml = multiplePrograms
    ? `о результатах&nbsp;проведения анкетирования ${categoryGen}<br>по образовательным программам<br><span style="font-size:14pt;font-weight:normal">${progListInline}</span>`
    : `о результатах&nbsp;проведения анкетирования ${categoryGen}<br>по образовательной программе<br>${programTitle}<br>${programCode}`;
  const anketaName = ankety.length === 1 ? escHtml(ankety[0].name) : escHtml(s.title);
  const commonStyles = `
  *{box-sizing:border-box}
  body{font-family:"Times New Roman",Times,serif;font-size:14pt;margin:0;color:#000}
  h2{font-size:14pt;text-align:center;font-weight:bold;margin:0 0 20px;line-height:1.6}
  .section-label{font-size:14pt;font-weight:bold;margin:20px 0 10px}
  .data-table{width:100%;border-collapse:collapse;font-size:12pt;page-break-inside:auto}
  .data-table thead{display:table-header-group}
  .data-table tr{page-break-inside:avoid}
  .data-table th,.data-table td{border:1px solid #000;padding:6px 10px;vertical-align:top}
  .data-table th{background:#f2f2f2;font-weight:bold;text-align:center}
  .data-table col.num{width:44px} .data-table col.score{width:130px}
  .data-table td:first-child,.data-table th:first-child{text-align:center;width:44px}
  .data-table th:last-child{text-align:center}
  .avg{font-size:14pt;margin-top:12px}
  .freetext-para{font-size:14pt;line-height:1.6;margin:12px 0;text-indent:1.25cm}`;
  const contentHtml = `
  <h2>ОТЧЕТ<br>${subtitleHtml}</h2>
  <div class="section-label">Перечень вопросов анкеты «${anketaName}»</div>
  <table class="data-table"><colgroup><col class="num"><col><col class="score"></colgroup>
    <thead><tr><th>№ п/п</th><th>Вопрос</th><th>Варианты ответов</th></tr></thead>
    <tbody>${questionsRows}</tbody>
  </table>
  <div class="section-label" style="page-break-before:always">Результаты анкетирования</div>
  <table class="data-table"><colgroup><col class="num"><col><col class="score"></colgroup>
    <thead><tr><th>№ п/п</th><th>Вопрос</th><th>Показатель удовлетворенности</th></tr></thead>
    <tbody>${resultsRows}</tbody>
  </table>
  ${freeTextHtml}
  <div class="avg">Средний балл удовлетворенности${multiplePrograms ? '' : mainProgram ? ' по образовательной программе' : ''} – <strong>${avgScore}</strong>.</div>`;
  if (format === 'word') {
    const wordTitlePage = `
<table border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;border:none;border-collapse:collapse;page-break-after:always">
  <tr height="150" style="height:150pt;mso-height-rule:exactly">
    <td align="center" valign="top" style="border:none;padding:0;text-align:center;vertical-align:top">
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:0 0 4pt;text-align:center">Министерство науки и высшего образования Российской Федерации</p>
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:0 0 4pt;text-align:center">Федеральное государственное бюджетное образовательное учреждение</p>
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:0 0 4pt;text-align:center">высшего образования</p>
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:0;text-align:center">«Сибирский государственный индустриальный университет»</p>
    </td>
  </tr>
  <tr height="400" style="height:400pt;mso-height-rule:exactly">
    <td align="center" valign="middle" style="border:none;padding:0;text-align:center;vertical-align:middle">
      <p style="font-family:'Times New Roman',serif;font-size:16pt;font-weight:bold;text-transform:uppercase;margin:0 0 10pt;text-align:center">ОТЧЕТ</p>
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;margin:0;text-align:center">о результатах проведения анкетирования ${categoryGen}</p>
      ${multiplePrograms
        ? `<p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;margin:0;text-align:center">по образовательным программам</p>` +
          programs.map((p, i) => `<p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;margin:0;text-align:center">${i===0?'(':''}${escHtml(p.code)} ${escHtml(p.name)}${p.programName ? ' &mdash; ' + escHtml(p.programName) : ''}${i===programs.length-1?')':''}</p>`).join('')
        : `<p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;margin:0;text-align:center">по образовательной программе</p>
           <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;margin:0;text-align:center">${programTitle}</p>
           ${programCode ? `<p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;margin:0;text-align:center">${programCode}</p>` : ''}`
      }
    </td>
  </tr>
  <tr height="150" style="height:150pt;mso-height-rule:exactly">
    <td align="center" valign="bottom" style="border:none;padding:0;text-align:center;vertical-align:bottom">
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:0 0 4pt;text-align:center">Новокузнецк</p>
      <p style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:0;text-align:center">${new Date().getFullYear()}</p>
    </td>
  </tr>
</table>`;
    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="UTF-8"><style>${commonStyles}
  @page{size:21cm 29.7cm;margin:25mm 25mm 25mm 25mm}
  body{margin:0;padding:0}
</style></head><body>
${wordTitlePage}
<div style="padding-top:20mm">${contentHtml}</div>
</body></html>`;
    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Отчет_${escHtml(s.title).replace(/[^а-яёА-ЯЁa-zA-Z0-9]/g,'_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const pdfTitlePage = `
<div style="width:210mm;min-height:297mm;padding:25mm 25mm 20mm;page-break-after:always;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center">
  <div style="font-family:'Times New Roman',serif;font-size:13pt;line-height:1.8">
    Министерство науки и высшего образования Российской Федерации<br>
    Федеральное государственное бюджетное образовательное учреждение<br>
    высшего образования<br>
    «Сибирский государственный индустриальный университет»
  </div>
  <div>
    <div style="font-family:'Times New Roman',serif;font-size:16pt;font-weight:bold;text-transform:uppercase;margin-bottom:16px">ОТЧЕТ</div>
    <div style="font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8">${subtitleHtml}</div>
  </div>
  <div style="font-family:'Times New Roman',serif;font-size:13pt;line-height:1.8">
    Новокузнецк<br>${year}
  </div>
</div>`;
    const pdfHtml = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><style>${commonStyles}
  @media print{body{margin:0}@page{size:A4;margin:0}}
</style></head><body>
${pdfTitlePage}
<div style="padding:20mm 25mm 20mm">${contentHtml}</div>
</body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(pdfHtml);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 600);
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
      let anketaTotalScore = 0, anketaScoredCount = 0;
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
          let wSum = 0, wTotal = 0;
          (q.options||[]).forEach((o, oi) => {
            const pts = Math.max(1, 5 - oi);
            wSum += pts * counts[o];
            wTotal += counts[o];
          });
          const coeff = wTotal > 0 ? (wSum / wTotal) : null;
          if (coeff !== null) { anketaTotalScore += coeff; anketaScoredCount++; }
          const coeffHtml = coeff !== null
            ? `<span style="font-size:12px;font-weight:700;color:#0078ff;background:#e8f4fe;padding:2px 8px;border-radius:8px;margin-left:8px">${coeff.toFixed(1)}</span>`
            : '';
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
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:10px">
              <span style="font-size:13px;font-weight:600;color:#424242">${escHtml(q.text)}${q.required?'<span style="color:#e53935"> *</span>':''}</span>
              ${coeffHtml}
            </div>
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
      const avgCoeff = anketaScoredCount > 0 ? (anketaTotalScore / anketaScoredCount).toFixed(1) : null;
      const avgHtml = avgCoeff !== null
        ? `<div style="margin-top:12px;padding:10px 14px;background:#f0f7ff;border-radius:10px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;color:#424242">Средний коэффициент удовлетворённости</span>
            <span style="font-size:18px;font-weight:700;color:#0078ff">${avgCoeff}</span>
           </div>`
        : '';
      return `<div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="font-size:14px;font-weight:600;color:#0078ff">${escHtml(anketa.name)}</div>
          <span style="font-size:12px;color:#9e9e9e;background:#f0f0f0;padding:2px 8px;border-radius:10px">${anketaResps.length} ответов</span>
        </div>
        ${stats || '<div style="color:#9e9e9e;font-size:12px">Нет данных по вопросам</div>'}
        ${avgHtml}
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
  const wMap = {'Bold':'700','Medium':'500','Regular':'400','Italic':'400'};
  const s = Object.assign({}, q.style || {}, _pendingStyles[q.id] || {});
  const qStyle = [
    s.align ? `text-align:${s.align}` : '',
    s.fontFamily ? `font-family:${s.fontFamily}` : '',
    wMap[s.fontStyle] ? `font-weight:${wMap[s.fontStyle]}` : '',
    (s.fontStyle==='Italic'||s.italic) ? 'font-style:italic' : '',
    s.fontSize ? `font-size:${s.fontSize}px` : '',
    s.fontColor ? `color:${s.fontColor}` : '',
    s.lineHeight ? `line-height:${s.lineHeight}` : '',
    s.paragraph ? `margin-bottom:${s.paragraph}px` : '',
  ].filter(Boolean).join(';');
  const optStyle = [
    s.fontFamily ? `font-family:${s.fontFamily}` : '',
    wMap[s.fontStyle] ? `font-weight:${wMap[s.fontStyle]}` : '',
    (s.fontStyle==='Italic'||s.italic) ? 'font-style:italic' : '',
    s.fontSize ? `font-size:${s.fontSize}px` : '',
    s.fontColor ? `color:${s.fontColor}` : '',
  ].filter(Boolean).join(';');
  const optSpanAttr = optStyle ? ` style="${optStyle}"` : '';
  let ansHtml = '';
  if (q.type === 'text') {
    ansHtml = `<input id="sq-${q.id}" class="student-ans-line" type="text" placeholder="Краткий ответ">`;
  } else if (q.type === 'paragraph') {
    ansHtml = `<textarea id="sq-${q.id}" class="student-ans-line" rows="3" placeholder="Развёрнутый ответ" style="resize:vertical;height:80px;width:100%"></textarea>`;
  } else if (q.type === 'radio') {
    ansHtml = (q.options||[]).map(opt => `
      <label class="student-opt">
        <input type="radio" name="sq_${q.id}" value="${escHtml(opt)}">
        <span${optSpanAttr}>${escHtml(opt)}</span>
      </label>`).join('');
  } else if (q.type === 'checkbox') {
    ansHtml = (q.options||[]).map(opt => `
      <label class="student-opt">
        <input type="checkbox" name="sq_${q.id}" value="${escHtml(opt)}">
        <span${optSpanAttr}>${escHtml(opt)}</span>
      </label>`).join('');
  }
  return `<div class="student-q-card" id="sqcard-${q.id}" data-anketa-id="${anketaId}" onclick="activateStudentCard('sqcard-${q.id}')">
    <div class="student-q-text"${qStyle ? ` style="${qStyle}"` : ''}>${escHtml(q.text)}${q.required?'<span style="color:#e53935"> *</span>':''}</div>
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
  const activeLinkId = sessionStorage.getItem('sibgiu_active_link');
  const activeLink = activeLinkId ? Store.surveyLinks.find(l => l.id === activeLinkId) : null;
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
      groupName: activeLink ? (activeLink.groupName || null) : null,
      programName: activeLink ? (activeLink.programName || null) : null,
      category: activeLink ? (activeLink.category || null) : null,
      linkId: activeLinkId || null,
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
  if (activeLinkId) {
    const surveyLinks = Store.surveyLinks;
    const lnk = surveyLinks.find(l => l.id === activeLinkId);
    if (lnk) {
      lnk.usedCount = (lnk.usedCount || 0) + 1;
      Store.surveyLinks = surveyLinks;
      const allLinks = surveyLinks.filter(l => l.surveyId === lnk.surveyId);
      if (allLinks.length > 0 && allLinks.every(l => (l.usedCount || 0) >= l.limit)) {
        const surveys = Store.surveys;
        const sv = surveys.find(s => s.id === lnk.surveyId);
        if (sv && sv.status === 'active') { sv.status = 'completed'; Store.surveys = surveys; }
      }
    }
    sessionStorage.removeItem('sibgiu_active_link');
  }
  renderThankYou();
}
function renderThankYou() {
  const wrap = document.getElementById('student-survey-wrap');
  if (!wrap) return;
  const survey = Store.surveys.find(x => x.id === currentStudentSurveyId);
  wrap.innerHTML = `
    <div style="text-align:center;padding:20px;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center">
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
  const drop = el._cselDrop || el.nextElementSibling;
  const isOpen = drop.classList.contains('open');
  document.querySelectorAll('.csel-drop.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.csel.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) {
    if (drop.parentElement !== document.body) {
      el._cselDrop = drop;
      drop._cselTrigger = el;
      document.body.appendChild(drop);
    }
    const r = el.getBoundingClientRect();
    drop.style.left = r.left + 'px';
    drop.style.width = 'auto';
    drop.style.minWidth = Math.min(r.width, 200) + 'px';
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
    const dr = drop.getBoundingClientRect();
    if (dr.right > window.innerWidth - 4) {
      drop.style.left = Math.max(4, window.innerWidth - drop.offsetWidth - 4) + 'px';
    }
  }
}
function setCsel(optEl, value, label) {
  const drop    = optEl.closest('.csel-drop');
  const trigger = drop._cselTrigger || drop.previousElementSibling;
  const hidSel  = trigger ? trigger.previousElementSibling : null;
  if (trigger) {
    const valEl = trigger.querySelector('.csel-val');
    if (valEl) valEl.textContent = label;
    trigger.classList.remove('open');
  }
  drop.querySelectorAll('.csel-opt').forEach(o => o.classList.remove('active'));
  optEl.classList.add('active');
  drop.classList.remove('open');
  if (hidSel) { hidSel.value = value; hidSel.dispatchEvent(new Event('change')); }
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
  const mobUser = document.getElementById('mob-user-name');
  if (mobUser) mobUser.textContent = '';
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
let _parsedGroupsData = null;
let _modalProgramIds = new Set();
function _ensureSurveyLinks(surveyId) {
  const s = Store.surveys.find(x => x.id === surveyId);
  if (!s) return;
  const isStudents = s.category === 'Обучающиеся';
  const programs = (s.programIds || []).map(pid => Store.programs.find(p => p.id === pid)).filter(Boolean);
  let links = Store.surveyLinks;
  let changed = false;
  const before = links.length;
  if (isStudents) {
    links = links.filter(l => l.surveyId !== surveyId || l.groupName);
  } else {
    links = links.filter(l => l.surveyId !== surveyId || !l.groupName);
  }
  if (links.length !== before) changed = true;
  const currentProgramIds = new Set(programs.map(p => p.id));
  const beforeProg = links.length;
  links = links.filter(l => l.surveyId !== surveyId || currentProgramIds.has(l.programId));
  if (links.length !== beforeProg) changed = true;
  if (isStudents) {
    const groupsMap = Store.groups;
    for (const prog of programs) {
      const progGroups = groupsMap[prog.name] || [];
      for (const g of progGroups) {
        const exists = links.find(l => l.surveyId === surveyId && l.programId === prog.id && l.groupName === g.name);
        if (!exists) {
          links.push({
            id: 'lnk-' + _slug(g.name) + '-' + Math.random().toString(36).substr(2, 4),
            surveyId, category: s.category,
            programId: prog.id, programName: prog.name,
            groupName: g.name,
            limit: g.count || 25, usedCount: 0,
            createdAt: Date.now()
          });
          changed = true;
        }
      }
    }
  } else {
    for (const prog of programs) {
      const exists = links.find(l => l.surveyId === surveyId && l.programId === prog.id && !l.groupName);
      if (!exists) {
        links.push({
          id: 'lnk-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          surveyId, category: s.category,
          programId: prog.id, programName: prog.name,
          groupName: null,
          limit: 25, usedCount: 0,
          createdAt: Date.now()
        });
        changed = true;
      }
    }
  }
  if (changed) Store.surveyLinks = links;
}
function renderSurveyAccess(surveyId) {
  const s = Store.surveys.find(x => x.id === surveyId);
  const cont = document.getElementById('survey-dostup');
  if (!cont || !s) return;
  _ensureSurveyLinks(surveyId);
  const isStudents = s.category === 'Обучающиеся';
  const programs = (s.programIds || []).map(pid => Store.programs.find(p => p.id === pid)).filter(Boolean);
  const allLinks = Store.surveyLinks.filter(l => l.surveyId === surveyId);
  if (!programs.length) {
    cont.innerHTML = `<div class="empty-state"><p>Добавьте образовательные программы во вкладке «Опрос»</p></div>`;
    return;
  }
  let contentHtml = '';
  if (isStudents) {
    contentHtml = programs.map(prog => {
      const progLinks = allLinks.filter(l => l.programId === prog.id);
      if (!progLinks.length) {
        return `
        <div class="access-prog-block">
          <div class="access-prog-header" onclick="toggleAccessProg(this)">
            <input type="checkbox" class="access-prog-check" onclick="event.stopPropagation()">
            <span class="access-prog-name">${prog.code ? escHtml(prog.code) + ' ' : ''}${escHtml(prog.name)}</span>
            <span style="color:#9e9e9e;font-size:12px;margin-left:auto;margin-right:8px">Загрузите группы через «Добавить группы»</span>
            <svg class="access-chevron" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>`;
      }
      const groupRows = progLinks.map(l => {
        const used = l.usedCount || 0;
        const exhausted = used >= l.limit;
        return `
        <div class="access-link-row${exhausted ? ' access-link-exhausted' : ''}">
          <input type="checkbox" class="access-check" data-link-id="${l.id}"${exhausted ? ' disabled' : ''}>
          <span class="access-link-name">${escHtml(l.groupName)}</span>
          <div class="access-limit-wrap">
            <input type="number" class="access-limit-input" value="${l.limit}" min="1" max="9999" step="1"
              onchange="updateLinkLimit('${l.id}', +this.value)" onclick="event.stopPropagation()">
          </div>
          <span class="access-limit-label">Участников опроса</span>
          ${exhausted
            ? `<span style="font-size:12px;color:#e53935;white-space:nowrap;font-weight:600">Лимит исчерпан</span>`
            : `<button class="btn-copy-link" onclick="copyAccessLink('${l.id}')">Копировать ссылку</button>`}
        </div>`;
      }).join('');
      const allExhausted = progLinks.every(l => (l.usedCount || 0) >= l.limit);
      return `
        <div class="access-prog-block">
          <div class="access-prog-header" onclick="toggleAccessProg(this)">
            <input type="checkbox" class="access-prog-check"${allExhausted ? ' disabled' : ''} onclick="event.stopPropagation();toggleAccessProgCheck(this)">
            <span class="access-prog-name">${prog.code ? escHtml(prog.code) + ' ' : ''}${escHtml(prog.name)}</span>
            <svg class="access-chevron" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="access-prog-groups">
            ${groupRows}
          </div>
        </div>`;
    }).join('');
  } else {
    contentHtml = programs.map(prog => {
      const link = allLinks.find(l => l.programId === prog.id && !l.groupName);
      if (!link) return '';
      const used = link.usedCount || 0;
      const exhausted = used >= link.limit;
      return `
        <div class="access-link-row${exhausted ? ' access-link-exhausted' : ''}">
          <input type="checkbox" class="access-check" data-link-id="${link.id}"${exhausted ? ' disabled' : ''}>
          <span class="access-link-name">${prog.code ? escHtml(prog.code) + ' ' : ''}${escHtml(prog.name)}</span>
          <div class="access-limit-wrap">
            <input type="number" class="access-limit-input" value="${link.limit}" min="1" max="9999" step="1"
              onchange="updateLinkLimit('${link.id}', +this.value)">
          </div>
          <span class="access-limit-label">Участников опроса</span>
          ${exhausted
            ? `<span style="font-size:12px;color:#e53935;white-space:nowrap;font-weight:600">Лимит исчерпан</span>`
            : `<button class="btn-copy-link" onclick="copyAccessLink('${link.id}')">Копировать ссылку</button>`}
        </div>`;
    }).join('');
  }
  const allLinksExhausted = allLinks.length > 0 && allLinks.every(l => (l.usedCount || 0) >= l.limit);
  cont.innerHTML = `
    <div class="access-top-bar">
      <label class="access-select-all-wrap">
        <input type="checkbox" id="access-check-all"${allLinksExhausted ? ' disabled' : ''} onchange="toggleAllAccessChecks(this.checked)">
        <span>Выбрать все</span>
      </label>
      <button class="btn btn-blue btn-sm" onclick="copySelectedAccessLinks()">Копировать выбранные ссылки</button>
    </div>
    <div class="access-list">
      ${contentHtml}
    </div>`;
}
function toggleAccessProg(header) {
  const block = header.closest('.access-prog-block');
  if (!block) return;
  const groups = block.querySelector('.access-prog-groups');
  const chevron = block.querySelector('.access-chevron');
  if (!groups) return;
  const isOpen = groups.style.display === 'flex';
  groups.style.display = isOpen ? 'none' : 'flex';
  groups.style.flexDirection = 'column';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}
function toggleAccessProgCheck(cb) {
  const block = cb.closest('.access-prog-block');
  if (!block) return;
  block.querySelectorAll('.access-check[data-link-id]:not([disabled])').forEach(c => c.checked = cb.checked);
}
function toggleAllAccessChecks(checked) {
  document.querySelectorAll('.access-check[data-link-id]:not([disabled])').forEach(cb => cb.checked = checked);
  document.querySelectorAll('.access-prog-check').forEach(cb => cb.checked = checked);
}
function updateLinkLimit(linkId, newLimit) {
  const links = Store.surveyLinks;
  const l = links.find(x => x.id === linkId);
  if (l) {
    if (!newLimit || isNaN(newLimit)) {
      toast('Количество участников не может быть пустым');
      const inp = document.querySelector(`.access-limit-input[onchange*="${linkId}"]`);
      if (inp) inp.value = l.limit;
      return;
    }
    if (!Number.isInteger(newLimit)) {
      toast('Количество участников должно быть целым числом');
      const inp = document.querySelector(`.access-limit-input[onchange*="${linkId}"]`);
      if (inp) inp.value = l.limit;
      return;
    }
    if (newLimit < 1) {
      toast('Количество участников не может быть меньше 1');
      const inp = document.querySelector(`.access-limit-input[onchange*="${linkId}"]`);
      if (inp) inp.value = l.limit;
      return;
    }
    const minLimit = l.usedCount || 0;
    if (newLimit < minLimit) {
      toast(`Нельзя установить количество участников меньше числа пройденных (${minLimit})`);
      const inp = document.querySelector(`.access-limit-input[onchange*="${linkId}"]`);
      if (inp) inp.value = l.limit;
      return;
    }
    l.limit = newLimit;
    Store.surveyLinks = links;
    const openNames = new Set();
    document.querySelectorAll('.access-prog-block').forEach(block => {
      const groups = block.querySelector('.access-prog-groups');
      if (groups && groups.style.display === 'flex') {
        const nameEl = block.querySelector('.access-prog-name');
        if (nameEl) openNames.add(nameEl.textContent);
      }
    });
    renderSurveyAccess(currentSurveyId);
    if (openNames.size) {
      document.querySelectorAll('.access-prog-block').forEach(block => {
        const nameEl = block.querySelector('.access-prog-name');
        if (nameEl && openNames.has(nameEl.textContent)) {
          const groups = block.querySelector('.access-prog-groups');
          const chevron = block.querySelector('.access-chevron');
          if (groups) { groups.style.display = 'flex'; groups.style.flexDirection = 'column'; }
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      });
    }
  }
}
function copyAccessLink(linkId) {
  const baseUrl = window.location.href.split('#')[0];
  navigator.clipboard.writeText(baseUrl + '#survey=' + linkId)
    .then(() => toast('Ссылка скопирована'));
}
function copySelectedAccessLinks() {
  const baseUrl = window.location.href.split('#')[0];
  const checked = [...document.querySelectorAll('.access-check[data-link-id]:checked')]
    .map(cb => cb.dataset.linkId);
  if (!checked.length) { toast('Выберите хотя бы одну ссылку'); return; }
  const text = checked.map(id => baseUrl + '#survey=' + id).join('\n');
  navigator.clipboard.writeText(text).then(() => toast('Скопировано: ' + checked.length));
}
function openGroupsModal() {
  const inp = document.getElementById('groups-file-input');
  if (inp) inp.value = '';
  const prev = document.getElementById('groups-preview');
  if (prev) prev.innerHTML = '';
  const btn = document.getElementById('groups-save-btn');
  if (btn) btn.style.display = 'none';
  _parsedGroupsData = null;
  openModal('modal-groups');
}
function handleGroupsFile(input) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const firstLine = text.split(/\r?\n/)[0].toLowerCase();
      if (firstLine.includes('???') || (!firstLine.includes('групп') && !firstLine.includes('ïðî') && !firstLine.includes('проф') && !firstLine.includes('прог') && !firstLine.includes('group'))) {
        const r2 = new FileReader();
        r2.onload = e2 => _previewGroupsCSV(e2.target.result);
        r2.readAsText(file, 'windows-1251');
      } else {
        _previewGroupsCSV(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  } else if (ext === 'xlsx' || ext === 'xls') {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const XLSXLib = window.XLSX || (typeof XLSX !== 'undefined' ? XLSX : null);
        if (!XLSXLib) {
          document.getElementById('groups-preview').innerHTML = '<p style="color:#e53935">Библиотека XLSX не загружена</p>';
          return;
        }
        const wb = XLSXLib.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSXLib.utils.sheet_to_json(ws, { defval: '' });
        _previewGroupsRows(rows);
      } catch(err) {
        document.getElementById('groups-preview').innerHTML = '<p style="color:#e53935">Ошибка чтения файла</p>';
      }
    };
    reader.readAsBinaryString(file);
  } else {
    document.getElementById('groups-preview').innerHTML = '<p style="color:#e53935">Поддерживаются форматы CSV и XLSX</p>';
  }
}
function _previewGroupsCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    document.getElementById('groups-preview').innerHTML = '<p style="color:#e53935">Файл пустой или содержит только заголовок</p>';
    return;
  }
  const delim = lines[0].includes(';') ? ';' : ',';
  const parseLine = l => {
    const fields = [];
    let cur = '', inQ = false;
    for (const ch of l) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delim && !inQ) { fields.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    fields.push(cur.trim());
    return fields;
  };
  const rows = lines.map(parseLine);
  const header = rows[0].map(h => h.toLowerCase().replace(/"/g, ''));
  const pIdx = header.findIndex(h => h.includes('профил') || h.includes('программ'));
  const gIdx = header.findIndex(h => h.includes('групп'));
  const cIdx = header.findIndex(h => h.includes('количеств') || h.includes('кол'));
  const sIdx = header.findIndex(h => h.includes('шифр') || h === 'код' || h === 'code');
  if (pIdx < 0 || gIdx < 0) {
    document.getElementById('groups-preview').innerHTML = '<p style="color:#e53935">Не найдены столбцы «Профиль»/«Программа» и «Группа»</p>';
    return;
  }
  const jsonRows = rows.slice(1)
    .filter(r => r[pIdx] && r[gIdx])
    .map(r => ({
      'Профиль': r[pIdx].replace(/"/g, ''),
      'Группа': r[gIdx].replace(/"/g, ''),
      'Количество': cIdx >= 0 ? r[cIdx].replace(/"/g, '') : '',
      'Шифр': sIdx >= 0 ? r[sIdx].replace(/"/g, '') : ''
    }));
  _previewGroupsRows(jsonRows);
}
function _findCol(row, ...hints) {
  const keys = Object.keys(row);
  for (const hint of hints) {
    const k = keys.find(k => k.toLowerCase().includes(hint.toLowerCase()));
    if (k && row[k] !== '' && row[k] !== undefined) return row[k];
  }
  return undefined;
}
function _previewGroupsRows(rows) {
  let lastProg = '', lastCode = '';
  const normalized = rows.map(r => {
    const dirKey = Object.keys(r).find(k => k.toLowerCase().includes('направлени') && !k.toLowerCase().includes('код') && !k.toLowerCase().includes('code'));
    const rawProg = String((dirKey ? r[dirKey] : null) ?? _findCol(r, 'профил', 'программ', 'program') ?? '').trim();
    if (rawProg) lastProg = rawProg;
    const prog = lastProg;
    const rawCode = String(_findCol(r, 'шифр', 'code') ?? _findCol(r, 'код') ?? '').trim();
    if (rawCode) lastCode = rawCode;
    const code = lastCode;
    const group = String(_findCol(r, 'групп', 'group') ?? '').trim();
    const rawCount = _findCol(r, 'количеств', 'кол', 'count', 'число', 'студент', 'чел');
    const countNum = rawCount !== undefined && rawCount !== null && String(rawCount).trim() !== '' ? +rawCount : NaN;
    const count = !isNaN(countNum) && countNum > 0 ? countNum : 25;
    return { prog, group, count, code };
  }).filter(r => r.prog && r.group);
  if (!normalized.length) {
    document.getElementById('groups-preview').innerHTML = '<p style="color:#e53935">Нет данных для импорта</p>';
    return;
  }
  const byProg = {};
  for (const r of normalized) {
    if (!byProg[r.prog]) byProg[r.prog] = { code: '', groups: [] };
    if (r.code && !byProg[r.prog].code) byProg[r.prog].code = r.code;
    const existing = byProg[r.prog].groups.find(g => g.name === r.group);
    if (existing) { existing.count = r.count; }
    else byProg[r.prog].groups.push({ name: r.group, count: r.count });
  }
  _parsedGroupsData = byProg;
  const previewHtml = Object.entries(byProg).map(([prog, { code, groups }]) => `
    <div style="margin-bottom:10px">
      <div style="font-weight:600;color:#212121;font-size:13px;margin-bottom:3px">${code ? escHtml(code) + ' · ' : ''}${escHtml(prog)}</div>
      ${groups.map(g => `<div style="font-size:12px;color:#424242;padding:1px 0 1px 10px">${escHtml(g.name)} — ${g.count} чел.</div>`).join('')}
    </div>`).join('');
  document.getElementById('groups-preview').innerHTML = `
    <div style="font-size:12px;color:#0078ff;font-weight:600;margin-bottom:8px">
      Программ: ${Object.keys(byProg).length} · Групп: ${normalized.length}
    </div>
    ${previewHtml}`;
  const btn = document.getElementById('groups-save-btn');
  if (btn) btn.style.display = '';
}
function saveGroupsFromParsed() {
  if (!_parsedGroupsData) return;
  const existing = Store.groups;
  for (const [prog, { groups }] of Object.entries(_parsedGroupsData)) {
    existing[prog] = groups;
  }
  Store.groups = existing;
  const programs = Store.programs;
  for (const [prog, { code }] of Object.entries(_parsedGroupsData)) {
    if (code) {
      const existingProg = programs.find(p => p.name === prog);
      if (existingProg) {
        if (!existingProg.code) { existingProg.code = code; }
      } else {
        programs.unshift({ id: uid(), code, name: prog, programName: '', dateModified: Date.now() });
      }
    }
  }
  Store.programs = programs;
  const links = Store.surveyLinks;
  let changed = false;
  for (const [prog, { groups }] of Object.entries(_parsedGroupsData)) {
    for (const g of groups) {
      const link = links.find(l => l.programName === prog && l.groupName === g.name);
      if (link && link.limit !== g.count) {
        link.limit = g.count;
        changed = true;
      }
    }
  }
  if (changed) Store.surveyLinks = links;
  closeModal('modal-groups');
  toast('Группы загружены');
  if (currentSurveyId && document.getElementById('survey-dostup')) {
    renderSurveyAccess(currentSurveyId);
  }
}
function _buildStatQBlocks(ankety, responses) {
  if (!ankety.length) return '<div class="empty-state" style="padding:16px 0"><p>К опросу не привязано ни одной анкеты</p></div>';
  return ankety.map(anketa => {
    const anketaResps = responses.filter(r => r.anketaId === anketa.id);
    const qBlocks = (anketa.questions || []).map((q, qi) => {
      if (q.type === 'radio' || q.type === 'checkbox') {
        const counts = {};
        (q.options || []).forEach(o => counts[o] = 0);
        for (const r of anketaResps) {
          const ans = r.answers[q.id];
          if (Array.isArray(ans)) ans.forEach(a => { if (a in counts) counts[a]++; });
          else if (ans && ans in counts) counts[ans]++;
        }
        const total = anketaResps.length || 1;
        const bars = (q.options || []).map(opt => {
          const n = counts[opt] || 0;
          const pct = Math.round(n / total * 100);
          return `<div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
              <span>${escHtml(opt)}</span>
              <span style="color:#424242;font-weight:600">${n} <span style="color:#9e9e9e;font-weight:400">(${pct}%)</span></span>
            </div>
            <div style="height:6px;background:#e8e8e8;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:#0078ff;border-radius:3px"></div>
            </div>
          </div>`;
        }).join('');
        return `<div class="stat-q-block">
          <div class="stat-q-num">Вопрос ${qi+1}</div>
          <div class="stat-q-text">${escHtml(q.text)}</div>
          <div style="margin-top:10px">${bars || '<span style="color:#9e9e9e;font-size:12px">Нет ответов</span>'}</div>
        </div>`;
      } else {
        const texts = anketaResps.map(r => r.answers[q.id]).filter(a => a && String(a).trim());
        const list = texts.length
          ? texts.map(t => `<div style="padding:6px 10px;border-left:3px solid #e0e0e0;font-size:13px;color:#424242;margin-bottom:6px">${escHtml(String(t))}</div>`).join('')
          : '<span style="color:#9e9e9e;font-size:12px">Нет ответов</span>';
        return `<div class="stat-q-block">
          <div class="stat-q-num">Вопрос ${qi+1}</div>
          <div class="stat-q-text">${escHtml(q.text)}</div>
          <div style="margin-top:10px">${list}</div>
        </div>`;
      }
    }).join('');
    return `<div style="margin-bottom:8px">
      <div style="font-size:13px;font-weight:600;color:#0078ff;margin-bottom:8px">${escHtml(anketa.name)}</div>
      ${qBlocks || '<div style="color:#9e9e9e;font-size:13px">Нет вопросов</div>'}
    </div>`;
  }).join('');
}
function toggleStatGroup(id) {
  const el = document.getElementById('stat-group-' + id);
  const chevron = document.getElementById('stat-chevron-' + id);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
}
function renderSurveyStat(surveyId) {
  const cont = document.getElementById('survey-stat');
  if (!cont) return;
  const s = Store.surveys.find(x => x.id === surveyId);
  if (!s) return;
  const allResponses = Store.responses.filter(r => r.surveyId === surveyId);
  const links = Store.surveyLinks.filter(l => l.surveyId === surveyId);
  const ankety = (s.anketaIds || []).map(aid => Store.ankety.find(a => a.id === aid)).filter(Boolean);
  const totalHtml = '';
  let groupsHtml = '';
  if (links.length) {
    const rows = links.map((l, i) => {
      const groupResps = allResponses.filter(r => r.linkId === l.id);
      const count = l.usedCount || 0;
      const pct = l.limit > 0 ? Math.round(count / l.limit * 100) : 0;
      const label = l.groupName
        ? `${escHtml(l.groupName)} <span style="color:#9e9e9e;font-size:12px;font-weight:400">(${escHtml(l.programName)})</span>`
        : escHtml(l.programName);
      const qHtml = _buildStatQBlocks(ankety, groupResps);
      const gid = l.id.replace(/[^a-z0-9]/gi, '');
      return `
        <div class="stat-group-block">
          <div class="stat-group-header" onclick="toggleStatGroup('${gid}')">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
                <span style="font-size:13px;font-weight:500">${label}</span>
                <span style="font-size:13px;color:#424242;font-weight:600;flex-shrink:0;margin-left:12px">${count} / ${l.limit}</span>
              </div>
              <div style="height:7px;background:#e8e8e8;border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${pct>=100?'#43a047':'#0078ff'};border-radius:4px"></div>
              </div>
              <div style="font-size:11px;color:#9e9e9e;margin-top:3px">${pct}% пройдено</div>
            </div>
            <svg id="stat-chevron-${gid}" style="flex-shrink:0;margin-left:12px;transition:transform .2s" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div id="stat-group-${gid}" style="display:none;padding:12px 16px 16px;border-top:1.5px solid #f0f0f0">
            ${count === 0
              ? '<div style="color:#9e9e9e;font-size:13px">Ещё нет ответов от этой группы</div>'
              : qHtml}
          </div>
        </div>`;
    }).join('');
    groupsHtml = `
      <div class="section-block">
        <div class="section-head"><div class="section-title">Прохождение по группам</div></div>
        <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">${rows}</div>
      </div>`;
  }
  cont.innerHTML = `<div style="padding:4px 0">${totalHtml}${groupsHtml}</div>`;
}
async function init() {
  await _loadFromServer();
  ensurePrograms();
  const hash = window.location.hash;
  if (hash.startsWith('#survey=')) {
    const linkId = hash.slice(8);
    const link = Store.surveyLinks.find(l => l.id === linkId);
    if (link && (link.usedCount || 0) < link.limit) {
      sessionStorage.setItem('sibgiu_active_link', linkId);
      hideLoginOverlay();
      openStudentSurvey(link.surveyId);
      return;
    }
    const overlay = document.getElementById('login-overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px">
        <div style="background:#fff;border-radius:16px;padding:40px;text-align:center;max-width:320px;box-shadow:0 8px 40px rgba(21,101,192,.13)">
          <div style="font-size:18px;font-weight:700;color:#212121;margin-bottom:8px">Ссылка недействительна</div>
          <div style="font-size:14px;color:#9e9e9e">Лимит прохождений исчерпан или ссылка не существует</div>
        </div>
      </div>`;
    return;
  }
  const auth = sessionStorage.getItem('sibgiu_auth');
  if (auth === 'admin') {
    hideLoginOverlay();
    goPage('dashboard');
  } else {
    showLoginOverlay();
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
    const passCount  = Store.surveyLinks.filter(l => l.surveyId === s.id).reduce((sum, l) => sum + (l.usedCount || 0), 0);
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
          <div style="font-size:26px;font-weight:700;color:#0078ff;line-height:1">${passCount}</div>
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
          {label:'Всего ответов', value: allSurveys.reduce((sum, s) => sum + Store.surveyLinks.filter(l => l.surveyId === s.id).reduce((s2, l) => s2 + (l.usedCount || 0), 0), 0)},
        ].map(c=>`<div style="flex:1;padding:12px 16px;border:1.5px solid #e0efff;border-radius:10px;text-align:center"><div style="font-size:24px;font-weight:700;color:#0078ff">${c.value}</div><div style="font-size:11px;color:#9e9e9e;margin-top:2px">${c.label}</div></div>`).join('')}
      </div>
      ${surveyBlocks || '<p style="color:#9e9e9e;text-align:center">Опросов нет</p>'}
    </div>`;
}
function exportReportPDF() {
  const sel = getSelectedSurveyIds();
  if (!sel.length) { toast('Выберите хотя бы один опрос'); return; }
  sel.forEach(id => exportReport(id, 'pdf'));
}
function exportReportWord() {
  const sel = getSelectedSurveyIds();
  if (!sel.length) { toast('Выберите хотя бы один опрос'); return; }
  sel.forEach(id => exportReport(id, 'word'));
}