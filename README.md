# wp_bot

nodejs + mongodb

mongodb client: robomingo

## install
cmd in folder:

`npm install`

`node index.js`

`/import wp_category`

`/import wp_plugins`

Команда: */wp info* — показывает сообщение с общей информацией

Команда: */wp lates* — присылает ссылку на cms wordpress последней версии с оффю сайта

Команда: */clear* — удаляет все сообщения бота которые он отправлял только в текущий запуск и только
принимает команду от id администратора прописанного в config.js
(если кто хочет прикрутить сохранения в базу то всё по аналогии с wp_plugins)

Команда: */wp_plugins* — показывает список плагинов для wordpress

Можно добавить в список хороший и нужный плагин для wordpress самому.

Сначала смотрим список категорий которые есть для wordpress плагинов

Команда: */wp_category* — Список категорий

Добавляем новую категорию (если надо):

`/wp_category (category_id) (text:Markdown)`

`/wp_category 3 SEO`

Добавляем запись в категорию:

`/wp_add (id категории) [Название плагина](url обычно на офф сайте wordpress) - Описание если надо
(разметка Markdown)`

`/wp_add 3 [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) - Хороший плагин для SEO`

## ( Export / Import ) mongodb data

Команда: */export wp_plugins* — Экспорт данных из mongodb коллекции wp_plugins сохраняется в /backup/wp_plugins.json 

Команда: */import wp_plugins* — Импорт из /backup/wp_plugins.json данных в mongodb в коллекцию wp_plugins

Команда: */export wp_category* — Экспорт данных из mongodb коллекции wp_categories сохраняется в /backup/wp_categories.json 

Команда: */import wp_category* — Импорт из /backup/wp_categories.json данных в mongodb в коллекцию wp_plugins

## Быстрые поисковые запросы
##### для Google

`/ok google поисковой запрос`

или

`/ok g поисковой запрос`

##### для Yandex

`/ok yandex поисковой запрос`

или

`/ok y поисковой запрос`
