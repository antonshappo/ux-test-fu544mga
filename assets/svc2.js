/* Услуги в корзине — прототип сценариев.
   v2 для теста в Useberry: один прототип, три задания с разными стартовыми корзинами
   (?task=zamer | tovar | kuhnya). Вся механика (замер, услуга к товару, установка кухни)
   доступна в любом задании. «Перейти к оформлению» проверяет состав по критерию задания
   и ведёт на success.html или done.html (с составом корзины в адресе).
   Источники: 2268:227195, 2268:261366, 2224:237887; правки Антона от 15.10.
   Контент — из сценария, оформление — по адаптивам. */
(function () {
  'use strict';

  const I = 'assets/fig/svc/';
  const LOADING_MS = 1200;
  const DUP = ['snack', 'modal'].includes(new URLSearchParams(location.search).get('dup')) ? new URLSearchParams(location.search).get('dup') : 'card';
  const MAX_QTY = 9999;     // описание карточки услуги 2836:434: на максимуме плюс неактивен
  const MIN_ORDER = 1500;   // минимальная стоимость заказа услуг (решение Антона 14.10: было 5000); разницу покрывает «Выезд мастера»

  /* ── Список корзин (декор) — из 2224:238724 ── */
  const BASKETS = [
    { active:true, store:'032', storeName:'Склад ФФЦ мск Южные врата', no:'2106 0737 3458', int:'13 000', frac:null,
      lines:['1. Дверь-купе SPACEO 225 × 04 мм высота проёма 2300 мм ЛДСП цвет белый широкий профиль','2. Стеллаж Spaceo KUB 2 секции 3 × 0. × 1.7 см ЛДСП цвет гикори джексон'], more:'+31',
      client:'Константин Константинопольский', date:'23 апр., 12:31', place:'062 — Склад ФФЦ мск Южные врата' },
    { fav:true, no:'2006 0003 9885', int:'300 675', frac:'15',
      lines:['1. Ламинированный пол 32 класс, цвет дуб','2. Стол обеденный прямоугольный, 16 × 0 см, массив дерева, цвет орех'], more:'+31',
      date:'23 апр., 12:31', place:'34 — Москва 2, Невский, Проспект Иванович' },
    { online:true, no:'2006 0003 9885', int:'270 581', frac:'15',
      lines:['1. Гидроизоляция обмазочная цементная Vetonit Weber.tec AquaSafe 20 кг','2. Дверь межкомнатная остеклённая Дюплекс/Фортуна 7 × 00 см, ПВХ, искусственный шпон, цвет венге'], more:'+31',
      date:'23 апр., 12:31', place:'062 Склад ФФЦ мск Южные врата, guest' },
    { store:'032', storeName:'Склад ФФЦ мск Южные врата', no:'2006 0003 9885', int:'150 230', frac:'20',
      lines:['1. Гидроизоляция обмазочная цементная Vetonit Weber.tec AquaSafe 20 кг','2. Дверь межкомнатная остеклённая Дюплекс/Фортуна 7 × 00 см, ПВХ, искусственный шпон, цвет венге'], more:'+31',
      client:'Константин Константинопольский', date:'23 апр., 12:31', place:'062 — Склад ФФЦ мск Южные врата' },
    { store:'032', storeName:'Склад ФФЦ мск Южные врата', storeInCart:true, no:'2006 0003 9885', int:'270 581', frac:'20',
      lines:['1. Гидроизоляция обмазочная цементная Vetonit Weber.tec AquaSafe 20 кг','2. Дверь межкомнатная остеклённая Дюплекс/Фортуна 7 × 00 см, ПВХ, искусственный шпон, цвет венге'], more:'+31',
      date:'23 апр., 12:31', place:'062 Склад ФФЦ мск Южные врата, guest' }
  ];

  /* ── Конфигураторы услуг к товару (контент — 2268:227263) ── */
  const STUB = [   // «Подробнее» — заглушка для услуг без текста (тексты варочных панелей — от Антона 14.10)
    'Выезд мастера на объект в согласованные дату и время.',
    'Выполнение работ в соответствии с технологией производителя.',
    'Уборка рабочего места после завершения работ.'
  ];
  const CONFIGS = {
    hob: {
      title: 'Установка и подключение варочных панелей',
      info: 'Работы должны быть начаты не позднее 7 (семи) календарных дней с даты оплаты заказа. Конкретную дату мастер согласует дополнительно.',
      groups: [
        { main: true, items: [
          { id: 'hob-el', name: 'Установка и подключение варочной электрической поверхности', price: 2040, tier: { from: 2, price: 1900 },
            incl: ['Установка техники. Подключение питающего кабеля к прибору силовым разъемом/ клеммных колодок 32 А в пределах до 1,5 м от места установки до точки подключения, с перфорацией мебельных перегородок, без доработки коммуникаций.',
              'В стоимость работ не входят: силовой разъем или клеммные колодки 32А, силовой кабель 1,5 м'] },
          { id: 'hob-rep', name: 'Замена варочной электрической поверхности', price: 2190,
            incl: ['Демонтаж старой варочной электрической поверхности. ' + 'Установка техники. Подключение питающего кабеля к прибору силовым разъемом/ клеммных колодок 32 А в пределах до 1,5 м от места установки до точки подключения, с перфорацией мебельных перегородок, без доработки коммуникаций.',
              'В стоимость работ не входят: силовой разъем или клеммные колодки 32А, силовой кабель 1,5 м',
              'Возможно повреждение столешницы'] }
        ] },
        { title: 'Дополнительные услуги', items: [
          { id: 'hob-dsp', name: 'Отверстие под варочную поверхность в ДСП/Массиве', price: 1110,
            incl: ['Разметка выпила под варочную поверхность в столешнице, выпил отверстия, герметизация пила от влаги.', 'В стоимость входит средство защиты от влаги.'] },
          { id: 'hob-hpl', name: 'Отверстие под варочную поверхность в HPL/Искусственный камень', price: 1440,
            incl: ['Разметка выпила под варочную поверхность в столешнице, выпил отверстия, герметизация пила от влаги.', 'В стоимость входит средство защиты от влаги.'] }
        ] }
      ]
    }
  };

  /* ── Конфигуратор замера (сценарий 2268:261366, кадры 04/04b/05) — самостоятельная позиция корзины ── */
  CONFIGS.measure = {
    title: 'Замер помещения для установки кухни',
    standalone: true,                      // не привязан к товару: своя карточка в корзине
    category: '15 Сборка и установка кухонь',
    info: 'Замер будет выполнен не позднее 3 (трёх) календарных дней с даты оплаты заказа. Конкретную дату мастер согласует дополнительно.',
    split: true,                           // заголовок+инфобар и карточки — разными блоками
    groups: [
      { main: true, items: [
        { id: 'msr-room', name: 'Замер одного помещения (комнаты)', price: 1700,
          label: 'Компенсируется при заказе установки',
          cartName: 'Замер помещения для установки кухни',   // так строка подписана в «Составе услуг» корзины (06)
          incl: ['Замер высоты, длины, ширины помещения. Замер размеров и расположения относительно пола и стен для всех артефактов, расположенных на стенах к которым будет примыкать будущий кухонный гарнитур: оконных и дверных проёмов, ниш, подоконников, радиаторов, труб отопления, газового оборудования и коммуникаций, сантехнических коммуникаций, вентиляционных отверстий, фартука, розеток, выключателей, электрических выводов. Замер углов между стенами, к которым будет примыкать кухонный гарнитур. Определение типа материала стен (плотный или декоративный(ГКЛ)).',
            'Замер оформляется в 2-х проекциях: «Вид сверху» + «Вид сбоку». Оригинал бланка замера предоставляется клиенту.',
            'Замер компенсируется при условии покупки услуг сборки и установки кухонного гарнитура в магазинах Лемана ПРО в течение 180 дней.'] }
      ] }
    ]
  };

  /* ── Дровер услуг (02, 2268:268457): инстор-услуги некликабельны, активен только «В каталог услуг» ── */
  const INSTORE = [
    { name: 'Колеровка', lm: '49111155', icon: 'tinting-32' },
    { name: 'Оверлок', lm: '49055102', icon: 'overlock-32' },
    { name: 'Раскрой', lm: '49055101', icon: 'cutting-32' },
    { name: 'Резка стекла', lm: '49022351', icon: 'glass-32' },
    { name: 'Резка дерева', lm: '49022401', icon: 'wood-32' }
  ];

  /* ── Каталог (2637:444511): отделы и подотделы ── */
  const MY = '15';
  const DEPTS = [
    ['01', 'Стройматериалы', ['Заборы', 'Кровля и водосточные системы', 'Локальные очистные сооружения', 'Подвесной потолок', 'Фасады отделка', 'Черновые полы, потолки и стены']],
    ['02', 'Столярные изделия', ['Вывоз б/у деревянных дверей, окон', 'Двери входные', 'Декоративные панели', 'Отделка деревом', 'Вывоз б/у металлических дверей', 'Двери межкомнатные', 'Окна со стока', 'Распил и резка (Инстор)', 'Террасы']],
    ['03', 'Электрика и освещение', ['Вывоз б/у кондиционеров', 'ИС Вентиляция', 'ИС Электрика', 'Обслуживание сплит-систем', 'Установка сплит-систем', 'Электротовары']],
    ['05', 'Напольные покрытия', ['Напольные покрытия', 'Оверлок']],
    ['06', 'Плитка', ['Ванная комната', 'Плитка']],
    ['07', 'Сантехника', ['Вывоз б/у ванн', 'Сантехника']],
    ['08', 'Водоснабжение', ['Анализ воды в магазине', 'Анализ воды на объекте', 'Водонагреватели/полотенцесушители', 'ИС Водоснабжение, отопление', 'ИС Коттеджные системы', 'ИС Пурифайеры', 'ИС Скважины', 'Котлы', 'Лабораторный анализ воды', 'Проточные фильтры', 'Радиаторы', 'Сантехшкаф']],
    ['09', 'Сад', ['Автополив', 'Бассейны', 'Заборы по проекту', 'Ландшафтный дизайн', 'Насосы', 'Новогодний декор', 'Пересадка комнатных растений', 'Садовая мебель', 'Теплицы', 'Уход за садом']],
    ['11', 'Краски', ['Декоративные покрытия', 'Колеровка', 'Краски', 'Обработка дерева', 'Покраска фасадов']],
    ['12', 'Отделочные материалы', ['Дизайн-проект «Технические чертежи»', 'Дизайн-проект', 'Карнизы и светозащита', 'Комплексный дизайн-проект', 'Обои', 'Подрезка рулонных штор', 'Пошив текстиля и установка карнизов']],
    ['13', 'Свет', ['Освещение внутри помещения', 'Освещение уличное', 'Карнизы и светозащита', 'Комплексный дизайн-проект']],
    ['14', 'Хранение', ['Вывоз б/у мебели', 'Мебель', 'МП Лига Диванов', 'Хранение и мебель']],
    ['15', 'Кухни', ['Бытовая техника ЛМ', 'Вывоз б/у КБТ', 'Модульная кухня', 'Проектная кухня', 'Реновация кухни', 'Сборка и установка кухонь']]
  ];
  /* ── Отдел «15 Кухни» (03, 2268:268350) и категория (03b, 2268:268307) ── */
  const MEASURES = [{ name: 'Замер помещения для установки кухни', cfg: 'measure' }, { name: 'Замер помещения для замены объекта кухни' }];
  const SU = 'Сборка и установка кухонь';
  const KITCHEN = [
    [SU, ['Проектные кухни', 'Модульные кухни', 'Аксессуары и освещение', 'Техника ЛМН', 'Сантехника ЛМН', 'Фильтры для воды', 'Столешницы/Стеновые панели ДСП/Массив ЛМН', 'Столешницы/Стеновые панели HPL ЛМН', 'Столешницы/Стеновые панели Камень ЛМН', 'Техника не ЛМН', 'Сантехника не ЛМН', 'Столешницы/Стеновые панели не ЛМН', 'Демонтаж/Замена', 'Общестроительные работы', 'Стеллаж Буккер', 'Выезды в удалённые города/дополнительные выезды', 'Корпуса проектной кухни с заказными фасадами']],
    ['Бытовая техника ЛМ', ['Варочные панели', 'Вытяжки', 'Духовые шкафы', 'Посудомоечные машины', 'СВЧ', 'Стиральные машины', 'Холодильники', 'Электроплиты', 'Дополнительные работы', 'Измельчители']],
    ['Реновация кухни', ['КОМБО предложение', 'Мойки замена', 'Мойки установка', 'Смесители замена', 'Смесители установка', 'Стеновые панели замена', 'Стеновые панели установка', 'Столешницы замена', 'Столешницы установка', 'Фасады замена']],
    ['Вывоз б/у КБТ', ['КБТ']],
    ['Модульная кухня', ['Комплект из 2 каркасов']]
  ];
  const DEPT_LINKS = [SU, 'Бытовая техника ЛМ', 'Реновация кухни', 'Вывоз б/у КБТ', 'Модульная кухня'];   // «Номенклатура» в 03, по строкам

  /* ── Конфигураторы категории «15 Сборка и установка кухонь» (сценарий 2224:237887) ──
     «Проектные кухни» — из кадров 05–07; остальные четыре — только строки, видимые в корзине 08/08a
     (решение Антона: наполнение других разделов добавим позже). */
  const KP_INFO = 'Работы должны быть начаты не позднее 6 (шести) календарных дней с даты оплаты заказа. Конкретную дату мастер согласует дополнительно.';
  CONFIGS.kp = { title: 'Проектные кухни', standalone: true, category: '15 Сборка и установка кухонь', info: KP_INFO, split: true, groups: [
    { title: 'Кухонные корпуса', items: [
      { id: 'kp-1', name: 'Сборка и установка кухонного каркаса (любого кроме колонны)', price: 1970, incl: [
        'Планирование этапов сборки.',
        'Сборка и установка каркаса верхнего или нижнего.',
        'Стягивание каркаса со смежными. Навеска каркаса на шину или штатные элементы крепления',
        'Навеска регулировка фасадов, установка цоколя, разметка и закрепление шины/креплений навески, установка ручек/пуш-открывателей на фасады, установка полок и выдвижных ящиков/метабоксов, установка и подпил ножек (штатных или приобретенных клиентом, минимальная высота 90 мм), уборка рабочего пространства по завершению, без выноса мусора на улицу.',
        'Установка сушки для посуды / корзины / бутылочницы / ведра входит в стоимость.',
        'Подрезка поддона и лотка для столовых приборов',
        'Дюбели и саморезы для навески и соединения каркасов входят в стоимость. Шина приобретается отдельно клиентом. Заглушки для не используемой перфорации приобретаются и устанавливаются отдельно клиентом.',
        'Все выпилы в каркасах, полках и присадки под петли входят в стоимость услуги.'] },
      { id: 'kp-2', name: 'Сборка и установка колонны', price: 2230 },
      { id: 'kp-3', name: 'Сборка и установка металлического каркаса', price: 860 } ] },
    { title: 'Дополнительные услуги', items: [
      { id: 'kp-4', name: 'Уменьшение глубины/высоты/ширины шкафа', price: 1840 },
      { id: 'kp-5', name: 'Прямой распил фальшпанели/фасада/полки', price: 270 },
      { id: 'kp-6', name: 'Выпил одного отверстия/углубления/присадка под петлю в материалах ДСП/Массив', price: 380 },
      { id: 'kp-7', name: 'Выпил одного отверстия/углубления в искусственном камне/HPL', price: 630 },
      { id: 'kp-8', name: 'Изготовление и установка ребра жёсткости каркаса из детали ДСП', price: 790 },
      { id: 'kp-9', name: 'Изготовление верхнего углового соединения под прямым углом', price: 4540 } ] },
    { title: 'Кухонная мебель', items: [
      { id: 'kp-10', name: 'Сборка стола вместе с проектной кухней', price: 1340 },
      { id: 'kp-11', name: 'Сборка стула вместе с проектной кухней', price: 570 },
      { id: 'kp-12', name: 'Сборка табурета вместе с проектной кухней', price: 380 } ] } ] };
  const kitchenCfg = (title, items) => ({ title, standalone: true, category: '15 Сборка и установка кухонь', groups: [{ items }] });
  CONFIGS.acc = kitchenCfg('Аксессуары и освещение', [
    { id: 'acc-1', name: 'Установка фальшпанели / заглушки', price: 920 },
    { id: 'acc-2', name: 'Изготовление и установка доборного элемента', price: 1530 } ]);
  CONFIGS.tl = kitchenCfg('Техника ЛМН', [
    { id: 'tl-5', name: 'Установка и подключение варочной электрической поверхности', price: 2040 },
    { id: 'tl-2', name: 'Установка и подключение встраиваемого электрического духового шкафа', price: 2020 },
    { id: 'tl-3', name: 'Установка и подключение вытяжки встраиваемой', price: 1630 },
    { id: 'tl-4', name: 'Установка и подключение встраиваемого холодильника', price: 2140 },
    { id: 'tl-1', name: 'Установка газовой варочной поверхности', price: 2310, incl: [
      'Разметка выпила в столешнице.', 'Выпил в столешнице.', 'Установка панели.',
      'Подключение питающего кабеля к прибору силовым разъемом/ клеммных колодок 32А в пределах до 1,5 м от места установки до точки подключения, с перфорацией мебельных перегородок, без доработки коммуникаций.',
      'Проверка работоспособности варочной панели.',
      'Входят в стоимость работ: силовой разъем или клеммные колодки 32А, силовой кабель 1,5 м.',
      'Силиконовый герметик не входит в стоимость работ'] } ]);   // газовая — в конце списка; в задании 3 нужна электрическая (дубль услуги к варочной панели, C11)
  CONFIGS.sl = kitchenCfg('Сантехника ЛМН', [
    { id: 'sl-1', name: 'Установка и подключение врезной мойки', price: 1550, incl: [
      'Разметка выпила в столешнице.', 'Выпил отверстия под мойку.', 'Установка мойки на герметик.',
      'Установка и подключение сифона к водоотводу не зависимо от длины водоотвода.',
      'Силиконовый герметик, шланги и трубы для наращивания не входят в стоимость работ.'] },
    { id: 'sl-2', name: 'Установка и подключение смесителя', price: 860 } ]);
  CONFIGS.sd = kitchenCfg('Столешницы/Стеновые панели ДСП/Массив ЛМН', [
    { id: 'sd-1', name: 'Установка столешницы ДСП (за 1 изготовленный элемент)', price: 4340, incl: [
      'Замер столешницы под размер по длине.', 'Обрезка столешницы под размер по длине.', 'Установка и закрепление столешницы.',
      'Установка торцевых или соединительных планок.',
      'Установка пристенного плинтуса ПВХ или алюминиевого (обязательна в комплекте со стеновой панелью МДФ/ДСП).',
      'Работы относятся к одному целому элементу столешницы, изготовленного мастером.',
      'В стоимость работ входит крепёж.',
      'Все выпилы в столешнице, в том числе продольный, входят в стоимость. Выпилы под мойку и варочную поверхность включены в стоимость их монтажа при условии, что установку выполняют наши специалисты. При самостоятельном монтаже клиентом эта услуга оплачивается отдельно.',
      'Установка барной стойки считается как установка одного или нескольких элементов столешницы с добавлением дополнительных работ при необходимости.',
      'В стоимости работ не входит силиконовый герметик'] },
    { id: 'sd-2', name: 'Прямой скос одного угла столешницы ДСП', price: 950 },
    { id: 'sd-3', name: 'Установка стеновой панели МДФ/ДСП (за 1 изготовленный элемент)', price: 2960 } ]);
  CONFIGS.measure.delOne = true;   // «Удалить услугу?» в единственном числе (2268:269155)
  // Левое меню конфигуратора (2224:237889): 16 пунктов; рабочие — с id конфигуратора, остальные некликабельны
  const KMENU = [['Проектные кухни', 'kp'], ['Модульные кухни'], ['Аксессуары и освещение', 'acc'], ['Техника ЛМН', 'tl'], ['Сантехника ЛМН', 'sl'],
    ['Столешницы/Стеновые панели ДСП/Массив ЛМН', 'sd'], ['Столешницы/Стеновые панели HPL ЛМН'], ['Столешницы/Стеновые панели Камень ЛМН'], ['Техника не ЛМН'],
    ['Сантехника не ЛМН'], ['Столешницы/Стеновые панели не ЛМН'], ['Демонтаж/Замена'], ['Общестроительные работы'], ['Стеллаж Буккер'],
    ['Выезды в удалённые города/дополнительные выезды'], ['Корпуса проектной кухни с заказными фасадами']];
  const KCFGS = KMENU.filter(m => m[1]).map(m => m[1]);
  const CFG_ORDER = ['measure'].concat(KCFGS);   // порядок самостоятельных позиций в корзине

  /* ── Задания теста: стартовая корзина и критерий успеха (точное совпадение состава услуг) ── */
  const HOB = { photo: 'p1', name: 'Индукционная варочная панель Hansa BHI683200 59 см 4 конфорки цвет чёрный', cfg: 'hob' };
  // Кухня: 50+ товаров (решение Антона 15.10) — 9 товаров макета повторяются с разными количествами; плитка услуг активна только у варочной панели
  const KBASE = [
    { photo: 'p2', name: 'Стяжка межсекционная  × 7 мм сталь цвет серебро 20 шт.', price: 204 },
    { photo: 'p3', name: 'Стеновая панель Дуб горный 24 ×. × 0 см ЛДСП цвет коричневый', price: 3007, tiles: ['Установка фартука на кухне', 'Замена фартука на кухне', 'Вывоз бывшей в употреблении мебели'] },
    { photo: 'p4', name: 'Столешница Дуб горный 24 ×. × 0 см ЛДСП цвет коричневый', price: 2650, tiles: ['Установка столешниц на кухне', 'Замена столешниц на кухне'] },
    { photo: 'p5', name: 'Каркас для напольного кухонного шкафа 4 ×  × 6 см KONSENSA ЛДСП цвет белый', price: 5368, tiles: ['Вывоз бывшей в употреблении мебели'] },
    { photo: 'p6', name: 'Фасад для кухонного шкафа Висла 39. × 02.1 см KONSENSA МДФ цвет белый', price: 2980, tiles: ['Замена кухонных фасадов и комплектующих', 'Вывоз бывшей в употреблении мебели'] },
    { photo: 'p7', name: 'Герметик силиконовый Tytan UPG Turbo санитарный уксусный прозрачный 280 мл', price: 460 },
    { photo: 'p8', name: 'Шина монтажная для шкафов 2000 мм, сталь, цвет серый', price: 820 },
    { photo: 'p9', name: 'Сушилка для посуды 36× 8 см двухуровневая  сталь цвет нержавеющая сталь', price: 1446 }
  ];
  const KQTY = [1, 2, 1, 3, 1, 4, 2, 1, 6, 1, 2, 5];
  const kitchenItems = () => [Object.assign({ id: 'k-hob', price: 20590, qty: 1 }, HOB)].concat(
    Array.from({ length: 50 }, (_, i) => Object.assign({ id: 'k' + i, qty: KQTY[i % KQTY.length] }, KBASE[i % KBASE.length])));

  const SCENARIOS = {
    zamer: {
      label: 'Замер',
      goods: { weight: '485,69' },
      items: kitchenItems(),   // была дверь (3050:231941) — респондента №1 смутило: задание про кухонный замер, а в корзине дверь
      target: { 'cfg:measure': { 'msr-room': 1 } }
    },
    tovar: {
      label: 'Услуга к товару',
      items: [   // 2268:227195
        Object.assign({ id: 'p-hob', price: 20500, qty: 1 }, HOB),
        { id: 'p-seal', photo: 'p7', name: 'Герметик силиконовый Tytan UPG Turbo санитарный уксусный прозрачный 280 мл', price: 500, qty: 1 }
      ],
      target: { 'p-hob': { 'hob-el': 1 } }
    },
    kuhnya: {
      label: 'Установка кухни',
      goods: { weight: '485,69' },
      items: kitchenItems(),
      target: { 'cfg:kp': { 'kp-1': 2 }, 'cfg:tl': { 'tl-5': 1 }, 'cfg:sl': { 'sl-1': 1 }, 'cfg:sd': { 'sd-1': 1 } }
    }
  };
  const TASK_ALIAS = { product: 'tovar', measure: 'zamer', kitchen: 'kuhnya' };

  let scen = 'zamer';
  let items = [];            // товары корзины
  let added = {};            // услуги в корзине: { ключ: { cfg, sel: { serviceId: qty } } }; ключ — id товара или «cfg:<id>» у самостоятельной позиции
  let buf = null;            // буфер конфигуратора: { cfgs: [id…], cur, item, sel: { cfgId: { sid: qty } }, had: { cfgId: bool } }
  let nav = [];              // стек экранов панели: { s: 'catalog'|'dept'|'cat'|'cfg' }
  let pendingDel = null;     // ключ позиции, которую удаляем по подтверждению
  let menuFor = null;        // открытое меню «⋯» самостоятельной позиции

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const plural = (n, f) => { const a = n % 10, b = n % 100; return n + ' ' + (a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 12 || b > 14) ? f[1] : f[2]); };
  const USL = ['услуга', 'услуги', 'услуг'], TOV = ['товар', 'товара', 'товаров'];
  const services = cfgId => CONFIGS[cfgId].groups.reduce((r, g) => r.concat(g.items), []);
  const unit = (s, q) => (s.tier && q >= s.tier.from ? s.tier.price : s.price);
  const lineSum = (cfgId, sel) => services(cfgId).reduce((r, s) => r + (sel[s.id] ? unit(s, sel[s.id]) * sel[s.id] : 0), 0);
  const lineCount = sel => Object.keys(sel).filter(k => sel[k] > 0).length;
  const cfgKey = cfgId => 'cfg:' + cfgId;
  const SID = {}; Object.keys(CONFIGS).forEach(c => services(c).forEach(s => { SID[s.id] = c; }));   // услуга → конфигуратор
  const keyFor = cfgId => (buf && buf.item ? buf.item : cfgKey(cfgId));   // товарная услуга хранится под id товара

  function totals() {
    const g = SCENARIOS[scen].goods;
    const goods = g && g.sum ? g.sum : items.reduce((r, i) => r + i.price * i.qty, 0);
    const goodsCnt = g && g.count ? g.count : items.length, weight = g && g.weight ? g.weight : '10,00';
    let srv = 0, cnt = 0;
    Object.values(added).forEach(a => { srv += lineSum(a.cfg, a.sel); cnt += lineCount(a.sel); });
    const trip = srv > 0 && srv < MIN_ORDER ? MIN_ORDER - srv : 0;
    return { goods, goodsCnt, weight, srv, cnt, trip, total: goods + srv + trip };
  }

  /* ── атомы ── */
  const priceHtml = (n, cls, unitTxt) => `<span class="fr-price ${cls}"><span class="fr-price__integer">${money(n)}</span><span class="fr-price__currency">₽</span>${unitTxt ? `<span class="fr-price__unit">${unitTxt}</span>` : ''}</span>`;
  const lbl = (cls, text, icon) => `<span class="fr-label ${cls}">${icon ? `<span class="fr-label__icon"><img src="${icon}" alt=""></span>` : ''}<span class="fr-label__text">${esc(text)}</span></span>`;
  const counter = (id, q, size, act) => `<div class="fr-counter fr-counter--${size}">
      <button class="fr-counter__btn" aria-label="Уменьшить" data-act="${act}-dec" data-id="${id}"><img src="${I}minus-20.svg" alt=""></button>
      <div class="fr-counter__value"><span>${q}</span></div>
      <button class="fr-counter__btn" aria-label="Увеличить" data-act="${act}-inc" data-id="${id}"${q >= MAX_QTY ? ' disabled' : ''}><img src="${I}plus-20.svg" alt=""></button></div>`;
  const infobar = (text, icon) => `<div class="fr-infobar fr-infobar--alert"><div class="fr-infobar__content"><span class="sv-ibico"><img src="${I}${icon || 'info'}-24.svg" alt=""></span>
      <div class="fr-infobar__text"><p class="fr-infobar__paragraph">${text}</p></div></div></div>`;
  const myLabel = () => `<span class="fr-label fr-label--default">Мой отдел</span>`;

  /* ══ Корзина ══════════════════════════════════════════════════════ */
  function renderBaskets() {
    const bprice = b => `<span class="fr-price fr-price--m is-accent"><span class="fr-price__integer">${b.int}</span>${b.frac ? `<span class="fr-price__fraction">,${b.frac}</span>` : ''}<span class="fr-price__currency">₽</span></span>`;
    $('baskets').innerHTML = BASKETS.map(b => {
      const tag = b.fav ? lbl('kz-lbl--fav', 'Избранное клиента', 'assets/fig/heart.svg') : b.online ? lbl('kz-lbl--online', 'Онлайн корзина', 'assets/fig/shopping-cart-simple.svg') : '';
      const store = `<div class="kz-bcard__store">${lbl('kz-lbl--store', b.store || '')}<span>${esc(b.storeName || '')}</span></div>`;
      return `<div class="kz-bcard ${b.active ? 'is-active' : ''}">${b.store && !b.storeInCart ? store : ''}
        <div class="kz-bcard__cart">${b.storeInCart ? store : ''}
          <div class="kz-bcard__hd"><div class="kz-bcard__num">${tag}<span class="kz-bcard__no">${b.no}</span></div>${bprice(b)}</div>
          <div class="kz-bcard__items"><div class="kz-bcard__lines">${b.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div><span class="kz-bcard__more">${b.more}</span></div>
          ${b.client ? `<div class="kz-bcard__row"><span>Клиент</span><span>${esc(b.client)}</span></div>` : ''}
          <div class="kz-bcard__ft"><span>${b.date}</span><span>${esc(b.place)}</span></div></div></div>`;
    }).join('');
  }

  const CHECK = '<svg viewBox="0 0 20 20" fill="none"><path d="M16.875 5.625L8.125 14.375L3.75 10" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const checkbox = `<label class="fr-checkbox fr-checkbox--l"><input type="checkbox" class="fr-checkbox__input" hidden><span class="fr-checkbox__box">${CHECK}</span></label>`;
  function tile(it) {
    const cfg = CONFIGS[it.cfg], a = added[it.id];
    if (a && lineCount(a.sel)) {
      return `<div class="sv-tile is-added" role="button" tabindex="0" data-act="open" data-id="${it.id}">
        <div class="sv-tile__ico"><img src="${I}services-40.svg" alt=""></div>
        <div class="sv-tile__info"><p class="sv-tile__t">${esc(cfg.title)}</p>${priceHtml(lineSum(it.cfg, a.sel), 'fr-price--m is-accent')}</div>
        <button class="sv-tile__btn" data-act="ask-del" data-id="${it.id}" aria-label="Удалить услуги"><img src="${I}trash-20.svg" alt=""></button></div>`;
    }
    return `<div class="sv-tile" role="button" tabindex="0" data-act="open" data-id="${it.id}">
      <p class="sv-tile__t">${esc(cfg.title)}</p>
      <button class="sv-tile__btn" data-act="open" data-id="${it.id}" aria-label="Добавить услуги"><img src="${I}plus-20.svg" alt=""></button></div>`;
  }
  const inertTile = title => `<div class="sv-tile is-inert"><p class="sv-tile__t">${esc(title)}</p><span class="sv-tile__btn"><img src="${I}plus-20.svg" alt=""></span></div>`;

  function goodsCard(it) {
    const tiles = it.cfg ? tile(it) : (it.tiles || []).map(inertTile).join('');
    return `
      <article class="kz-item">
        <div class="kz-goodsrow">
          <div class="kz-goodsrow__lead">${checkbox}<img class="kz-photo" src="assets/products/${it.photo}.png" alt=""></div>
          <div class="kz-gbody">
            <div class="kz-gtop">
              <div class="kz-gname">
                <div class="kz-gmeta"><span>ЛМ 8664 8552</span><span class="kz-gmeta__dot">•</span><span>Вес — 10,00 кг</span></div>
                <p class="kz-gtitle">${esc(it.name)}</p>
              </div>
              <div class="kz-gmenu"><button class="kz-dots" aria-label="Ещё"><img class="kz-ico20" src="assets/fig/dots-20.svg" alt=""></button></div>
            </div>
            <div class="kz-gfoot">
              <div class="kz-gbtns">
                <button class="kz-link" aria-label="Ссылка"><img class="kz-ico20" src="assets/fig/link-20.svg" alt=""></button>
                <div class="kz-asm"><span class="kz-asm__lbl">Сборка<img class="kz-ico16" src="assets/fig/question-16.svg" alt=""></span>
                  <label class="fr-switch fr-switch--m fr-switch--accent"><input type="checkbox" role="switch" class="fr-switch__input" checked></label></div>
              </div>
              <div class="kz-gright">
                <div class="fr-priceblock fr-priceblock--l">
                  <span class="fr-price fr-price--l is-accent fr-priceblock__main"><span class="fr-price__integer">${money(it.price * it.qty)}</span><span class="fr-price__currency">₽</span></span>
                  <span class="fr-price fr-price--xs is-default fr-priceblock__unitprice"><span class="fr-price__integer">${money(it.price)}</span><span class="fr-price__currency">₽</span><span class="fr-price__unit">/шт</span></span>
                </div>
                <div class="kz-picker">
                  <div class="fr-counter fr-counter--m fr-counter--wide">
                    <button class="fr-counter__btn" aria-label="Уменьшить"><img src="assets/fig/minus-20.svg" alt=""></button>
                    <div class="fr-counter__value"><span>${it.qty}</span><span>шт.</span></div>
                    <button class="fr-counter__btn" aria-label="Увеличить"><img src="assets/fig/plus-20.svg" alt=""></button>
                  </div>
                  <div class="kz-stock">Доступно 5 304 шт.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${tiles ? `<div class="kz-srv"><div>${lbl('kz-lbl--service', 'Услуги мастера')}</div><div class="sv-tiles">${tiles}</div></div>` : ''}
      </article>`;
  }
  /* Самостоятельная позиция — «Корзина товар + услуга v3», вариант «Замер» (адаптив 2854:210869) */
  function cfgCard(key) {
    const a = added[key], cfg = CONFIGS[a.cfg], n = lineCount(a.sel);
    const label = services(a.cfg).map(s => s.label).filter(Boolean)[0];
    const dupNames = dupsOf(added).filter(d => d.c.key === key).map(d => d.name);   // вариант Б (31.10): строки-дубли выделены
    const rows = services(a.cfg).filter(s => a.sel[s.id]).map((s, i) =>
      `<div class="sv-cc__row${dupNames.includes(s.name) ? ' is-dup' : ''}"><span class="sv-cc__name"><span class="sv-cc__num">${i + 1}.</span><span>${esc(s.cartName || s.name)}</span></span>${priceHtml(unit(s, a.sel[s.id]) * a.sel[s.id], 'fr-price--s is-default')}</div>`).join('');   // 2268:268893: 15/20 Regular; нумерация — 2881:115803
    return `
      <article class="kz-item sv-cc">
        <div class="sv-cc__top">
          <div class="sv-cc__lead">${checkbox}<div class="sv-cc__ico"><img src="${I}kitchen-design-32.svg" alt=""></div></div>
          <div class="sv-cc__info">
            <div class="kz-gmeta sv-cc__meta"><span>${plural(n, USL)}</span><span class="kz-gmeta__dot">•</span><span>${esc(cfg.category)}</span></div>
            <p class="kz-gtitle">${esc(cfg.title)}</p>
            ${label ? `<div>${lbl('sv-lbl--comp', label, I + 'percent-16.svg')}</div>` : ''}
          </div>
          ${priceHtml(lineSum(a.cfg, a.sel), 'fr-price--l is-accent')}
          <div class="sv-cc__menuwrap">
            <button class="kz-dots" data-act="menu" data-id="${key}" aria-label="Ещё" aria-expanded="${menuFor === key}"><img class="kz-ico20" src="assets/fig/dots-20.svg" alt=""></button>
            ${menuFor === key ? `<div class="sv-menu" role="menu">
              <button class="sv-menu__i" role="menuitem" data-act="edit" data-id="${key}">Изменить</button>
              <button class="sv-menu__i" role="menuitem" data-act="ask-del" data-id="${key}">Удалить</button></div>` : ''}
          </div>
        </div>
        <div class="sv-cc__comphead">${lbl('kz-lbl--service', 'Состав услуг')}
          <button class="sv-cc__edit" data-act="edit" data-id="${key}">Изменить<img src="${I}chevron-right-20.svg" alt=""></button></div>
        <div class="sv-cc__comp" role="button" tabindex="0" data-act="edit" data-id="${key}" aria-label="Изменить состав услуг">${rows}</div>
        ${hasDup(key) ? infobar('Эти услуги уже есть в корзине. Проверь, не добавлены ли они по ошибке', 'warning') : ''}
      </article>`;
  }
  /* C11 (3137:632741): та же услуга добавлена и отдельно, и к товару — предупреждение в карточке отдельной позиции */
  const selNames = a => services(a.cfg).filter(s => a.sel[s.id] > 0).map(s => s.name);
  function hasDup(key) {
    const own = selNames(added[key]);
    return Object.keys(added).some(k => !k.startsWith('cfg:') && selNames(added[k]).some(n => own.includes(n)));
  }
  // Пары дублей в состоянии корзины A: одна и та же услуга (по названию) у товара и в отдельной позиции
  function dupsOf(A) {
    const res = [], picked = k => services(A[k].cfg).filter(s => A[k].sel[s.id] > 0);
    Object.keys(A).filter(k => !k.startsWith('cfg:')).forEach(pk => picked(pk).forEach(ps =>
      Object.keys(A).filter(k => k.startsWith('cfg:')).forEach(ck => picked(ck).filter(cs => cs.name === ps.name).forEach(cs =>
        res.push({ name: ps.name, price: ps.price, p: { key: pk, sid: ps.id }, c: { key: ck, sid: cs.id }, id: pk + '|' + ck + '|' + ps.name })))));
    return res;
  }
  function renderItems() {
    const standalone = Object.keys(added).filter(k => k.startsWith('cfg:')).sort((a, b) => CFG_ORDER.indexOf(added[a].cfg) - CFG_ORDER.indexOf(added[b].cfg));
    $('items').innerHTML = standalone.map(cfgCard).join('') + items.map(goodsCard).join('');
  }
  function renderTotals() {
    const t = totals();
    const goodsCnt = t.goodsCnt;
    $('lbarCnt').innerHTML = `<span class="kz-lbar__dot">•</span><span>Товаров ${goodsCnt}</span>` +
      (t.cnt ? `<span class="kz-lbar__dot">•</span><span>Услуг ${t.cnt}</span>` : '');
    $('footLine').innerHTML = `<span>${plural(goodsCnt, TOV)}</span><span class="kz-foot__dot">•</span><span>Вес: ${t.weight} кг</span>` +
      (t.cnt ? `<span class="kz-foot__dot">•</span><span>${plural(t.cnt, USL)}</span>` : '');
    $('footTotal').textContent = money(t.total);
    $('footInfo').hidden = !t.cnt;
    if (!t.cnt) $('footHint').hidden = true;
    const row = (l, n) => `<div class="sv-hint__row"><span>${l}</span>${priceHtml(n, 'is-default')}</div>`;
    $('footHint').innerHTML = `<div class="sv-hint__rows">${row(`Товары (${goodsCnt})`, t.goods)}${row(`Услуги (${t.cnt})`, t.srv)}${t.trip ? row('Выезд мастера (1)', t.trip) : ''}</div>
      <button class="sv-hint__close" data-act="hint-close" aria-label="Закрыть"><img src="${I}x-24.svg" alt=""></button>`;
  }
  function renderCart() { renderItems(); renderTotals(); }

  /* ══ Дровер услуг ═════════════════════════════════════════════════ */
  function renderDrawer() {
    $('drawerList').innerHTML = INSTORE.map(r => `
      <div class="sv-drow"><span class="sv-drow__ico"><img src="${I}${r.icon}.svg" alt=""></span>
        <span class="sv-drow__t"><span class="sv-drow__n">${r.name}</span><span class="sv-drow__s"><span>ЛМ</span> ${r.lm}</span></span>
        <img class="sv-drow__chev" src="assets/fig/chevron-right.svg" alt=""></div>`).join('') + `
      <button class="sv-drow sv-drow--cat" data-act="to-catalog"><span class="sv-drow__ico"><img src="${I}services-32.svg" alt=""></span>
        <span class="sv-drow__t"><span class="sv-drow__n">В каталог услуг</span><span class="sv-drow__s">Монтаж, установка, ремонт и другие услуги</span></span>
        <img class="sv-drow__chev" src="assets/fig/chevron-right.svg" alt=""></button>`;
  }
  const drawer = open => { $('drawer').hidden = !open; document.body.style.overflow = open ? 'hidden' : ''; };

  /* ══ Панель «Добавление услуг»: страницы каталога и конфигуратор ═══ */
  function showPanel() { $('cfg').hidden = false; document.body.style.overflow = 'hidden'; }
  function closePanel() { $('cfg').hidden = true; document.body.style.overflow = ''; buf = null; nav = []; }
  const crumbsHtml = list => `<nav class="sv-crumbs" aria-label="Хлебные крошки">${list.map((c, i) =>
      `${i ? `<img src="assets/fig/svc/chevron-right-20.svg" alt="">` : ''}<button class="sv-crumbs__i" data-act="go" data-id="${c[1]}">${esc(c[0])}</button>`).join('')}</nav>`;
  const CR_CAT = ['Каталог', 'catalog'], CR_DEPT = [MY + ' Кухни', 'dept'], CR_SU = [MY + ' ' + SU, 'cat'];
  // Button link primary / M (fronton): hover — фон control-minor; ссылки вне задания тоже с hover, но без действия
  const link = (text, act) => `<button class="fr-link-btn fr-link-btn--m sv-link"${act ? ` data-act="go" data-id="${act}"` : ' data-inert="1"'}>${esc(text)}</button>`;
  // 4 колонки. Блок отделов в каталоге заполняется по столбцам (01–05 | 06–09 | 11–14 | 15), остальные списки — по строкам, как в макетах
  const cols = (arr, byColumn) => { const n = 4, out = [[], [], [], []];
    if (byColumn) { const per = Math.ceil(arr.length / n); arr.forEach((x, i) => out[Math.floor(i / per)].push(x)); }
    else arr.forEach((x, i) => out[i % n].push(x));
    return out; };
  const svcTile = (name, act, measure) => `<${act ? 'button' : 'div'} class="sv-ctile${act ? '' : ' is-inert'}"${act ? ` data-act="go" data-id="${act}"` : ''}>
      ${measure ? `<img class="sv-ctile__m" src="${I}measure-24.svg" alt="">` : ''}<span class="sv-ctile__t">${esc(name)}</span><img class="sv-ctile__c" src="assets/fig/chevron-right.svg" alt=""></${act ? 'button' : 'div'}>`;

  function pageCatalog() {   // 2637:444511
    return `<div class="sv-catalog">
      <div class="sv-cblock">
        <div class="sv-hrow"><p class="sv-h1">Каталог</p>
          <button class="fr-btn fr-btn--secondary fr-btn--s sv-tomy" data-act="go" data-id="dept"><img src="assets/fig/m/arrow-u-down-right.svg" alt="">В мой отдел: ${MY} Кухни</button></div>
        <div class="sv-cols sv-cols--top">${cols(DEPTS, true).map(c => `<div class="sv-col">${c.map(d => link(d[0] + ' ' + d[1], d[0] === MY ? 'dept' : null)).join('')}</div>`).join('')}</div>
      </div>
      <p class="sv-found sv-found--white">1 345 услуг</p>
      <div class="sv-csecs">${DEPTS.map(d => `
        <section class="sv-csec"><div class="sv-csec__h"><p class="sv-h3">${d[0]} ${esc(d[1])}</p>${d[0] === MY ? myLabel() : ''}</div>
          <div class="sv-cols">${cols(d[2]).map(c => `<div class="sv-col">${c.map(x => link(x, d[0] === MY && x === SU ? 'cat' : null)).join('')}</div>`).join('')}</div></section>`).join('')}
      </div></div>`;
  }
  function pageHead(crumbs, title, count, linksHtml) {
    return `<div class="sv-phead2">${crumbsHtml(crumbs)}
      <div class="sv-hrow sv-hrow--page"><p class="sv-h1">${esc(title)}</p>${myLabel()}</div>${linksHtml || ''}</div>
      <p class="sv-found">${count}</p>`;
  }
  function pageDept() {   // 2268:268350
    const links = `<div class="sv-cols sv-cols--top">${cols(DEPT_LINKS).map(c => `<div class="sv-col">${c.map(x => link(MY + ' ' + x, x === SU ? 'cat' : null)).join('')}</div>`).join('')}</div>`;
    return pageHead([CR_CAT], MY + ' Кухни', '452 услуги', links) + `
      <div class="sv-tsecs">
        <section class="sv-tsec2"><p class="sv-h3">Замеры</p><div class="sv-ctiles">${MEASURES.map(m => svcTile(m.name, m.cfg ? 'cfg:' + m.cfg : null, true)).join('')}</div></section>
        ${KITCHEN.map(k => `<section class="sv-tsec2"><p class="sv-h3">${MY} ${esc(k[0])}</p><div class="sv-ctiles">${k[1].map(c => { const m = k[0] === SU && KMENU.find(x => x[0] === c && x[1]); return svcTile(c, m ? 'cfg:' + m[1] : null); }).join('')}</div></section>`).join('')}
      </div>`;
  }
  function pageCat() {   // 2268:268307
    return pageHead([CR_CAT, CR_DEPT], MY + ' ' + SU, '34 услуги') + `
      <div class="sv-tsecs">
        <div class="sv-ctiles">${svcTile(MEASURES[0].name, 'cfg:measure', true)}</div>
        <div class="sv-ctiles">${KITCHEN[0][1].map(c => { const m = KMENU.find(x => x[0] === c && x[1]); return svcTile(c, m ? 'cfg:' + m[1] : null); }).join('')}</div>
      </div>`;
  }

  /* ── Конфигуратор ── */
  const open = new Set();   // раскрытые «Подробнее»
  let dynOpen = null;       // открытая подсказка порогов динамической цены
  function scard(s) {
    const q = buf.sel[SID[s.id]][s.id] || 0;
    return `<div class="sv-scard${q ? ' is-on' : ''}">
      <div class="sv-scard__row">
        <div class="sv-scard__l">
          <div class="sv-scard__tw">${s.label ? `<div>${lbl('fr-label--accent fr-label--alert', s.label, I + 'percent-16.svg')}</div>` : ''}<p class="sv-scard__t">${esc(s.name)}</p></div>
          <button class="sv-more" data-act="more" data-id="${s.id}">${open.has(s.id) ? 'Свернуть' : 'Подробнее'}<img src="${I}${open.has(s.id) ? 'chevron-up-small-20' : 'chevron-down-small-20'}.svg" alt=""></button>
        </div>
        <div class="sv-scard__r">
          <div class="sv-scard__price">
            <div class="fr-priceblock__top">${s.tier && q >= s.tier.from
              ? priceHtml(s.tier.price, 'fr-price--m is-accent', '/шт.') + priceHtml(s.price, 'fr-price--xs fr-price--old is-default', '/шт.')
              : priceHtml(s.price, 'fr-price--m is-accent', '/шт.')}</div>
            ${s.tier ? `<span class="sv-dyn">От ${s.tier.from} шт цена ${money(s.tier.price)} ₽<button class="sv-dyn__i" data-act="dyn-hint" data-id="${s.id}" aria-label="Пороги цены"><img src="${I}question-16-blue.svg" alt=""></button>
              ${dynOpen === s.id ? `<span class="sv-hint sv-hint--dyn"><span class="sv-hint__rows">
                <span class="sv-hint__row"><span>1 шт</span>${priceHtml(s.price, 'is-default', '/шт.')}</span>
                <span class="sv-hint__row"><span>От ${s.tier.from} шт</span>${priceHtml(s.tier.price, 'is-default', '/шт.')}</span></span>
                <button class="sv-hint__close" data-act="dyn-hint" data-id="${s.id}" aria-label="Закрыть"><img src="${I}x-24.svg" alt=""></button></span>` : ''}</span>` : ''}
          </div>
          ${q ? counter(s.id, q, 'm', 'c') : `<button class="fr-btn fr-btn--secondary fr-btn--m" data-act="c-add" data-id="${s.id}">Добавить</button>`}
        </div>
      </div>
      ${open.has(s.id) ? `<div class="sv-incl">${(s.incl || STUB).map(x => `<div class="sv-incl__i"><img src="${I}check-16.svg" alt=""><span>${esc(x)}</span></div>`).join('')}</div>` : ''}
    </div>`;
  }
  function compRows(cfgId) {
    const sel = buf.sel[cfgId];
    return services(cfgId).filter(s => sel[s.id]).map(s => `
      <div class="sv-crow">
        <p class="sv-crow__n">${esc(s.name)}</p>
        <button class="sv-crow__del" data-act="c-del" data-id="${s.id}" aria-label="Удалить услугу"><img src="${I}trash-24.svg" alt=""></button>
        <div class="sv-crow__line">${counter(s.id, sel[s.id], 's', 'c')}
          <span class="sv-crow__sum">${priceHtml(unit(s, sel[s.id]) * sel[s.id], 'fr-price--s is-accent')}${sel[s.id] > 1 ? priceHtml(unit(s, sel[s.id]), 'fr-price--xs is-default sv-crow__unit', '/шт.') : ''}</span></div>
      </div>`).join('');
  }
  function renderCfg() {
    const cfg = CONFIGS[buf.cur], it = buf.item && items.find(i => i.id === buf.item);
    // Левое меню конфигураторов категории (2224:237889) — только когда в буфере несколько конфигураторов
    const menu = $('cfgMenu');
    menu.hidden = buf.cfgs.length < 2;
    if (buf.cfgs.length > 1) {
      menu.innerHTML = `<div class="sv-kmenu">${KMENU.map(m => {
        const n = m[1] ? lineCount(buf.sel[m[1]]) : 0, on = m[1] === buf.cur;
        return `<${m[1] ? 'button' : 'div'} class="sv-kmenu__i${on ? ' is-on' : ''}${m[1] ? '' : ' is-inert'}"${m[1] ? ` data-act="cfg-switch" data-id="${m[1]}"` : ''}>
          <span class="sv-kmenu__t">${esc(m[0])}</span>${n ? `<span class="sv-kmenu__b">${n}</span>` : ''}</${m[1] ? 'button' : 'div'}>`; }).join('')}</div>`;
    }
    const left = $('cfgLeft'), y = left.scrollTop;
    const head = `<section class="sv-block"><p class="sv-block__h1">${esc(cfg.title)}</p>${cfg.info ? infobar(cfg.info) : ''}</section>`;
    left.innerHTML = cfg.split
      ? head + cfg.groups.map(g => `<section class="sv-block${g.title ? ' sv-block--extra' : ''}">${g.title ? `<p class="sv-block__h2">${esc(g.title)}</p>` : ''}${g.items.map(scard).join('')}</section>`).join('')
      : cfg.groups.map(g => g.main || !g.title
        ? `<section class="sv-block"><p class="sv-block__h1">${esc(cfg.title)}</p>${cfg.info ? infobar(cfg.info) : ''}${g.items.map(scard).join('')}</section>`
        : `<section class="sv-block sv-block--extra"><p class="sv-block__h2">${esc(g.title)}</p>${g.items.map(scard).join('')}</section>`).join('');
    left.scrollTop = y;

    // «Состав услуг» — общий буфер: группы по конфигураторам, итог по всем
    let n = 0, sum = 0, had = false;
    const groups = buf.cfgs.map(c => {
      const k = lineCount(buf.sel[c]); n += k; sum += lineSum(c, buf.sel[c]); had = had || buf.had[c];
      if (k) return `<p class="sv-comp__g">${esc(CONFIGS[c].title)}</p>${compRows(c)}`;
      if (buf.had[c]) return `<p class="sv-comp__g">${esc(CONFIGS[c].title)}</p>${infobar('Состав услуги не выбран. При применении добавленные ранее услуги будут удалены из корзины')}`;
      return '';
    }).join('');
    let body, tab = '';
    if (n) {
      body = (sum < MIN_ORDER ? infobar(`Минимальная стоимость заказа ${money(MIN_ORDER)} ₽`) : '') + groups;
      tab = `<div class="sv-tab"><div class="sv-comp__div"></div>
        <div class="sv-tab__sum"><div class="sv-tab__l">Итого <span>${plural(n, USL)}</span></div>${priceHtml(sum, 'fr-price--xlm is-accent')}</div>
        <button class="fr-btn fr-btn--accent fr-btn--l" data-act="apply">Применить</button></div>`;
    } else if (had) {
      body = groups;
      tab = `<div class="sv-tab"><button class="fr-btn fr-btn--accent fr-btn--l" data-act="apply">Применить</button></div>`;
    } else {
      body = `<div class="sv-empty"><img src="${I}empty-cart.svg" alt=""><p>Добавь услуги</p></div>`;
    }
    $('cfgRight').innerHTML = (it ? `
      <div class="sv-prod"><img src="assets/products/${it.photo}.png" alt="">
        <div class="sv-prod__i"><p class="sv-prod__cap"><span>Услуги к товару:</span><span>ЛМ 8664 8552</span></p><p class="sv-prod__n">${esc(it.name)}</p></div></div>` : '') + `
      <div class="sv-comp">
        <div class="sv-comp__head"><div class="sv-comp__hrow"><p>Состав услуг</p>${n ? `<span class="sv-tip"><button class="sv-iconbtn" aria-label="Распечатать предрасчёт" aria-describedby="tipPrint"><img src="${I}printer-24.svg" alt=""></button><span class="sv-tip__b" role="tooltip" id="tipPrint">Распечатать предрасчёт</span></span>` : ''}</div><div class="sv-comp__div"></div></div>
        <div class="sv-comp__body">${body}</div>
        ${tab}
      </div>`;
  }
  function renderPanel() {
    const top = nav[nav.length - 1];
    const isCfg = top.s === 'cfg';
    $('cfgPage').hidden = isCfg; $('cfgBody').hidden = !isCfg;
    const fromCatalog = !!(buf && CONFIGS[buf.cur].standalone);
    $('cfgCrumbs').hidden = !(isCfg && fromCatalog);
    $('cfgPanel').classList.toggle('is-white', top.s === 'catalog');
    if (isCfg) { if (fromCatalog) $('cfgCrumbs').innerHTML = crumbsHtml([CR_CAT, CR_DEPT, CR_SU]); renderCfg(); }
    else { const pg = $('cfgPage'); pg.innerHTML = top.s === 'catalog' ? pageCatalog() : top.s === 'dept' ? pageDept() : pageCat(); pg.scrollTop = 0; }
  }
  function startCfg(cfgs, cur, itemId) {
    const sel = {}, had = {};
    cfgs.forEach(c => { const k = itemId || cfgKey(c); const cs = added[k] ? added[k].sel : {}; sel[c] = Object.assign({}, cs); had[c] = lineCount(cs) > 0; });
    buf = { cfgs, cur, item: itemId || null, sel, had };
    open.clear(); dynOpen = null; $('cfgLeft').scrollTop = 0;
  }
  function openProduct(itemId) { const it = items.find(i => i.id === itemId); startCfg([it.cfg], it.cfg, itemId); nav = [{ s: 'cfg' }]; showPanel(); renderPanel(); }
  // Самостоятельный конфигуратор; конфигураторы кухни открываются вместе — с левым меню и общим составом
  function openStandalone(cfgId, stack) { startCfg(KCFGS.includes(cfgId) ? KCFGS : [cfgId], cfgId); nav = (stack || []).concat({ s: 'cfg' }); showPanel(); renderPanel(); }
  function go(s) {   // переход по ссылке/крошке внутри панели
    nav = nav.filter(x => x.s !== 'cfg');   // из конфигуратора по крошке — на страницу, буфер не сохраняем
    if (s.startsWith('cfg:')) { openStandalone(s.slice(4), nav); return; }
    const i = nav.findIndex(x => x.s === s);
    nav = i >= 0 ? nav.slice(0, i + 1) : nav.concat({ s });
    if (s !== 'cfg') buf = null;
    showPanel(); renderPanel();
  }
  function back() {
    nav.pop();
    if (!nav.length) { closePanel(); return; }
    if (nav[nav.length - 1].s !== 'cfg') buf = null;
    renderPanel();
  }
  // Загрузка корзины после любых изменений (3046:204857): ~1,2 с, затем новое состояние
  function withLoading(fn) {
    document.body.classList.add('is-loading'); $('loading').hidden = false;
    setTimeout(() => { fn(); document.body.classList.remove('is-loading'); $('loading').hidden = true; }, LOADING_MS);
  }
  /* Дубли C11 — три варианта для сравнения, параметр &dup=:
     card  — жёлтая плашка в карточке отдельной позиции (по умолчанию, 3137:632748);
     snack — плашка + снекбар в момент появления дубля (3452:269074);
     modal — после «Применить» дровер закрывается, в корзине модалка со всеми дублями: строка на каждую копию,
             у каждой «Удалить»; удалить обе копии нельзя. «Отмена» — оставить как есть, тогда в карточке плашка */
  let dupState = null, snackTimer = null;   // dupState: { dups, drop: { 'key|sid': true } }
  function applyCfg() {
    const next = {}; Object.keys(added).forEach(k => { next[k] = { cfg: added[k].cfg, sel: Object.assign({}, added[k].sel) }; });
    buf.cfgs.forEach(c => {
      const sel = {}; Object.keys(buf.sel[c]).forEach(k => { if (buf.sel[c][k] > 0) sel[k] = buf.sel[c][k]; });
      const key = buf.item || cfgKey(c);
      if (lineCount(sel)) next[key] = { cfg: c, sel }; else delete next[key];
    });
    const before = dupsOf(added).map(d => d.id);
    const fresh = dupsOf(next).some(d => !before.includes(d.id));
    added = next;
    closePanel();
    withLoading(() => {
      renderCart();
      if (fresh && DUP === 'snack') showSnack();
      if (fresh && DUP === 'modal') openDupModal();
    });
  }
  function showSnack() {
    $('snack').hidden = false; clearTimeout(snackTimer);
    snackTimer = setTimeout(() => { $('snack').hidden = true; }, 6000);
  }
  // Модалка показывает ВСЕ дубли корзины, не только новые: в корзине важна полная картина
  function openDupModal() { dupState = { dups: dupsOf(added), drop: {} }; renderDupModal(); $('dupModal').hidden = false; }
  function dupRow(r, other) {
    const a = added[r.key], s = services(a.cfg).find(x => x.id === r.sid), q = a.sel[r.sid], id = r.key + '|' + r.sid;
    const isProd = !r.key.startsWith('cfg:'), it = isProd && items.find(i => i.id === r.key);
    const gone = dupState.drop[id], locked = !gone && dupState.drop[other.key + '|' + other.sid];
    const media = isProd ? `<img class="sv-dup__ph" src="assets/products/${it.photo}.png" alt="">`
      : `<span class="sv-dup__ic"><img src="${I}kitchen-design-32.svg" alt=""></span>`;
    return `<div class="sv-dup__row${gone ? ' is-gone' : ''}">${media}
      <div class="sv-dup__src"><p class="sv-dup__kind">${isProd ? 'Услуги мастера' : 'Состав услуг'}</p>
        <p class="sv-dup__where">${esc(isProd ? it.name : CONFIGS[a.cfg].title)}</p></div>
      <div class="sv-dup__sum"><span class="sv-dup__qty">${q} шт. × ${money(unit(s, q))} ₽</span>${priceHtml(unit(s, q) * q, 'fr-price--m is-accent')}</div>
      ${gone ? `<button class="fr-btn fr-btn--pseudo fr-btn--m sv-dup__undo" data-act="dup-undo" data-id="${id}"><img src="${I}arrow-u-down-right-20.svg" alt="">Вернуть</button>`
        : `<button class="sv-iconbtn sv-dup__del" data-act="dup-drop" data-id="${id}" aria-label="Удалить"${locked ? ' disabled title="Одну копию нужно оставить"' : ''}><img src="${I}trash-24.svg" alt=""></button>`}
    </div>`;
  }
  function renderDupModal() {
    // Вординг один для любого числа дублей (решение Антона 31.10)
    $('dupT').textContent = 'Дубли услуг в корзине';
    $('dupLead').textContent = 'Одни и те же услуги добавлены в корзину дважды. Удали лишние, если они добавлены по ошибке.';
    $('dupList').innerHTML = dupState.dups.map(d => `<section class="sv-dup__item"><h3 class="sv-dup__name">${esc(d.name)}</h3>
      ${dupRow(d.p, d.c)}${dupRow(d.c, d.p)}</section>`).join('');
  }
  function resolveDups() {
    const drops = Object.keys(dupState.drop);
    $('dupModal').hidden = true; dupState = null;
    if (!drops.length) return;
    drops.forEach(id => { const [k, sid] = id.split('|'); if (added[k]) { delete added[k].sel[sid]; if (!lineCount(added[k].sel)) delete added[k]; } });
    withLoading(renderCart);
  }
  function askDelete(key) {
    pendingDel = key; menuFor = null;
    $('confirmT').textContent = CONFIGS[added[key].cfg].delOne ? 'Удалить услугу?' : 'Удалить услуги?';   // 2268:269155 / 2268:228726, 2272:549589
    $('confirm').hidden = false; renderItems();
  }

  /* ══ Задания ═════════════════════════════════════════════════════ */
  // Тексты — как на стартовой странице (index.html, TASKS); менять в обоих местах
  const TASK_TEXT = {
    zamer: { n: 1, title: 'Замер', text: 'Добавь в корзину замер помещения для установки кухни и нажми «Перейти к оформлению».' },
    tovar: { n: 3, title: 'Услуга к товару', text: 'Добавь к варочной панели в корзине установку и подключение и нажми «Перейти к оформлению».' },
    kuhnya: { n: 2, title: 'Установка кухни', text: 'Добавь услуги установки кухни:', list: ['Сборка и установка кухонного каркаса — 2 шт.', 'Установка и подключение варочной электрической поверхности — 1 шт.', 'Установка и подключение врезной мойки — 1 шт.', 'Установка столешницы ДСП — 1 шт.'], after: 'Затем нажми «Перейти к оформлению».' }
  };
  // Перечень — буллетами с новой строки, у каждой позиции количество
  const taskHtml = t => `<p>${esc(t.text)}</p>${t.list ? `<ul>${t.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p>${esc(t.after)}</p>` : ''}`;
  function taskCard(show) {
    $('taskCard').hidden = !show;
    document.querySelector('.ut-task__tab').setAttribute('aria-expanded', show);
  }
  function startScenario(key) {
    scen = key;
    items = (SCENARIOS[key].items || []).map(i => Object.assign({}, i));
    added = {}; menuFor = null;
    closePanel(); drawer(false); $('confirm').hidden = true; $('footHint').hidden = true;
    $('onb').hidden = false; $('snack').hidden = true; $('dupModal').hidden = true; dupState = null;
    const t = TASK_TEXT[key];
    $('taskK').textContent = 'Задание ' + t.n + ' из 3'; $('taskT').textContent = t.title; $('taskX').innerHTML = taskHtml(t);
    taskCard(true);   // при старте задание раскрыто и висит до «Понятно» (клики по корзине и Esc его не сворачивают)
    renderCart();
  }
  // Состав корзины в строку для адреса: «ключ=услуга*кол,…;…» (cfg:kp=kp-1*2;p-hob=hob-el*1)
  const cartString = () => Object.keys(added).sort().map(k => k + '=' + Object.keys(added[k].sel).sort().map(sid => sid + '*' + added[k].sel[sid]).join(',')).join(';');
  function parseCart(str) {
    const res = {};
    (str || '').split(';').filter(Boolean).forEach(e => {
      const [k, list] = e.split('='); const sel = {};
      (list || '').split(',').filter(Boolean).forEach(x => { const [sid, q] = x.split('*'); if (SID[sid]) sel[sid] = +q; });
      if (Object.keys(sel).length) res[k] = { cfg: SID[Object.keys(sel)[0]], sel };
    });
    return res;
  }
  function isSuccess() {
    const t = SCENARIOS[scen].target, ks = Object.keys(added);
    if (ks.length !== Object.keys(t).length) return false;
    return ks.every(k => t[k] && Object.keys(added[k].sel).length === Object.keys(t[k]).length &&
      Object.keys(t[k]).every(sid => added[k].sel[sid] === t[k][sid]));
  }
  function checkout() {
    const q = 'task=' + scen + '&cart=' + encodeURIComponent(cartString());
    location.href = (isSuccess() ? 'success.html?' : 'done.html?') + q;
  }

  /* ══ События ══════════════════════════════════════════════════════ */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!e.target.closest('.sv-cc__menuwrap') && menuFor) { menuFor = null; renderItems(); }
    if (!b) { if (!e.target.closest('#footHint')) $('footHint').hidden = true; return; }
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'hint-close') $('footHint').hidden = true;
    if (act === 'task-toggle') taskCard($('taskCard').hidden);
    if (act === 'task-close') taskCard(false);
    switch (act) {
      case 'open': openProduct(id); break;
      case 'add-services': drawer(true); break;
      case 'drawer-close': drawer(false); break;
      case 'to-catalog': drawer(false); nav = []; go('dept'); break;
      case 'go': go(id); break;
      case 'back': back(); break;
      case 'menu': e.stopPropagation(); menuFor = menuFor === id ? null : id; renderItems(); break;
      case 'edit': menuFor = null; openStandalone(added[id].cfg, []); break;
      case 'ask-del': e.stopPropagation(); askDelete(id); break;
      case 'confirm-no': $('confirm').hidden = true; pendingDel = null; break;
      case 'confirm-yes': delete added[pendingDel]; pendingDel = null; $('confirm').hidden = true; withLoading(renderCart); break;
      case 'checkout': checkout(); break;
      case 'onb-close': $('onb').hidden = true; break;
      case 'snack-close': $('snack').hidden = true; clearTimeout(snackTimer); break;
      case 'dup-cancel': $('dupModal').hidden = true; dupState = null; break;
      case 'dup-drop': dupState.drop[id] = true; renderDupModal(); break;
      case 'dup-undo': delete dupState.drop[id]; renderDupModal(); break;
      case 'dup-apply': resolveDups(); break;
      case 'cfg-close': closePanel(); break;
      case 'apply': applyCfg(); break;
      case 'more': open.has(id) ? open.delete(id) : open.add(id); renderCfg(); break;
      case 'c-add': buf.sel[SID[id]][id] = 1; renderCfg(); break;
      case 'c-inc': { const sl = buf.sel[SID[id]]; sl[id] = Math.min(MAX_QTY, (sl[id] || 0) + 1); renderCfg(); break; }
      case 'cfg-switch': buf.cur = id; open.clear(); dynOpen = null; $('cfgLeft').scrollTop = 0; renderCfg(); break;
      case 'dyn-hint': dynOpen = dynOpen === id ? null : id; renderCfg(); break;
      case 'c-dec': { const sl = buf.sel[SID[id]]; sl[id] = Math.max(0, (sl[id] || 0) - 1); if (!sl[id]) delete sl[id]; renderCfg(); break; }
      case 'c-del': delete buf.sel[SID[id]][id]; renderCfg(); break;
    }
  });
  // П.1: «Добавление товаров и услуг» прилипает на 86 px (шапка 74 + 12); тень M ↓ — только в закреплённом состоянии
  const addBlock = document.querySelector('.kz-add');
  const onScroll = () => { if (addBlock) addBlock.classList.toggle('is-stuck', addBlock.getBoundingClientRect().top <= 86.5 && window.scrollY > 0); };
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
  // Хинт футера: по наведению и по клику на info-иконку
  const info = $('footInfo');
  info.addEventListener('mouseenter', () => { $('footHint').hidden = false; });
  info.addEventListener('click', e => { e.stopPropagation(); $('footHint').hidden = !$('footHint').hidden; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('dupModal').hidden) { $('dupModal').hidden = true; dupState = null; }
    else if (!$('confirm').hidden) { $('confirm').hidden = true; pendingDel = null; }
    else if (!$('drawer').hidden) drawer(false);
    else if (!$('cfg').hidden) closePanel();
    else if (menuFor) { menuFor = null; renderItems(); }
    else $('footHint').hidden = true;
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });

  const P = new URLSearchParams(location.search), st = P.get('state');   // читаем до replaceState
  // &demo=1 — витрина для команды (dubli.html): без вкладки «Задание»
  renderBaskets(); renderDrawer();
  let tq = P.get('task') || TASK_ALIAS[P.get('s')] || 'zamer';
  if (!SCENARIOS[tq]) tq = 'zamer';
  startScenario(tq);
  // Финальные страницы показывают корзину участника приглушённой: ?frozen=1&cart=…
  if (P.get('cart')) { added = parseCart(P.get('cart')); renderCart(); }
  if (P.get('frozen')) { document.body.classList.add('is-frozen'); taskCard(false); }
  if (P.get('demo')) { taskCard(false); $('task').hidden = true; }

  // Для проверки: &state=added — состав-эталон задания; &open=1 (tovar) — конфигуратор; &drawer=1; &page=catalog|dept|cat|cfg; &menu=1; &confirm=1
  if (st === 'added') { const t = SCENARIOS[scen].target; Object.keys(t).forEach(k => { added[k] = { cfg: SID[Object.keys(t[k])[0]], sel: Object.assign({}, t[k]) }; }); renderCart(); }
  if (P.get('open') && scen === 'tovar') openProduct('p-hob');
  if (P.get('drawer')) drawer(true);
  const pg = P.get('page');
  if (pg === 'catalog') go('catalog');
  if (pg === 'dept') go('dept');
  if (pg === 'cat') { go('dept'); go('cat'); }
  if (pg === 'cfg') { go('dept'); go('cat'); go(scen === 'kuhnya' ? 'cfg:kp' : 'cfg:measure'); }
  const firstCfg = Object.keys(added).find(k => k.startsWith('cfg:'));
  if (P.get('menu') && firstCfg) { menuFor = firstCfg; renderItems(); }
  if (P.get('confirm')) { const k = Object.keys(added)[0]; if (k) askDelete(k); }
  if (P.get('hint')) $('footHint').hidden = false;
})();
