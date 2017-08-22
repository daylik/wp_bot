# wp_bot

nodejs + mongodb

mongodb client: robomingo

## install
cmd in folder:

`npm install`

`node index.js`

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

