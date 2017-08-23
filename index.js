//functions
const isset = function(v_var) {
    if (typeof(v_var) == 'number') {
        if (isNaN(v_var)) {
            return false;
        }
    }
    if (typeof(v_var) == 'undefined' || v_var === null) {
        return false;
    }
    return true;
};
const log = function(data) {
    console.log(data);
};

//go
const Config = require('./config');
const fs = require('fs');
const _ = require('lodash');
const log4js = require('log4js');
log4js.configure({
    appenders: {
        wp_bot_error: {
            type: 'file',
            filename: 'wp_bot_error.log'
        }
    },
    categories: {
        default: {
            appenders: ['wp_bot_error'],
            level: 'error'
        }
    }
});
const logger = log4js.getLogger('wp_bot_error');

const TelegramBot = require('node-telegram-bot-api');
const token = Config.token;
const bot = new TelegramBot(token, {
    polling: true
});

const blacklist = /105240665/;
const is_bloklist = function(v) {
    if (blacklist.test(v)) { return true; } return false;
}


const html_Markdown = {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    disable_notification: true
};
const format_html = {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    disable_notification: true
};
const silent_and_no_preview = {
    disable_web_page_preview: true,
    disable_notification: true
};
const silent = {
    disable_notification: true
};

//DB mongodb
const mongoose = require('mongoose');
//db connect
if (Config.mongoose.user != '') {
    mongoose.connect('mongodb://' + Config.mongoose.user + ':' + Config.mongoose.pass + '@' + Config.mongoose.url, Config.mongoose.options);
} else {
    mongoose.connect('mongodb://' + Config.mongoose.url, Config.mongoose.options);
}
//DB SCHEME таблиц
const WP_categroy_schema = mongoose.Schema({
    cat: {
        type: String,
        unique: true,
        required: true
    },
    name: String
});
const WP_schema = mongoose.Schema({
    cat: String,
    txt: String
});

const WP_category = mongoose.model('Wp_category', WP_categroy_schema);
const WP_plugin = mongoose.model('Wp_plugin', WP_schema);

global.bot_msgs = [];
Bot_msg_push = function(chat, msg) {
    msg++;
    console.log('bot send to: 'chat + '  ' + msg);
    global.bot_msgs.push({
        'chat_id': chat,
        'msg_id': msg
    });
};

const send_err = function(err, text, msg_id) {
    console.log(err);
    if (Config.err_logger) {
        logger.error(text + ' err:[' + err + ']');
    }
    if (Config.err_send_admin) {
        Bot_msg_push(msg.chat.id, msg.message_id);
        bot.sendMessage(Config.admin_id, 'Ошибка: ' + text, html_Markdown);
    }
    if (Config.err_send_msg) {
        Bot_msg_push(msg.chat.id, msg.message_id);
        bot.sendMessage(msg_id, 'Ошибка: ' + text, html_Markdown);
    }
}

const BOT_send_msg = function(chat_id, message_id, send_text, options) {
    log(send_text + '\n');
    Bot_msg_push(chat_id, message_id);
    bot.sendMessage(chat_id, send_text, options);
}

// /wp_add (cat number)  (Markdown text)
bot.onText(/\/wp_add ((cat:)?([\w]+))[,\s]+((txt:)?([^\'\"]+))/, (msg, match) => {
    if (!is_bloklist(msg.from.id)) {
        if (isset(match[3]) && isset(match[6])) {

            log(match[3]);
            log(match[6]);

            var send_data = new WP_plugin({
                cat: match[3],
                txt: match[6]
            });
            send_data.save(function(err, send_data, num) {
                if (err) {
                    send_err(err, 'Ошибка записи данных в mongodb:WP_plugin');
                    return console.error(err);
                }

                log('Wordpress плагин успешно добавлен!\n');
                //bot.sendMessage(msg.from.id, 'Wordpress плагин успешно добавлен!');

                setTimeout(function() {
                    WP_plugin.find(function(err, data) {
                        if (err) {
                            send_err(err, 'при поиске данных в mongodb:WP_plugin');
                        } else {
                            log(data);
                            WP_category.find(function(err, data_category) {
                                if (err) {
                                    send_err(err, 'при поиске данных в mongodb:WP_category');
                                } else {
                                    var html = '';
                                    for (var c = 0; c < data_category.length; c++) {
                                        html += '\n*' + data_category[c].name + '*\n';

                                        for (var i = 0; i < data.length; i++) {
                                            if (data[i].cat == data_category[c].cat) {
                                                html += data[i].txt + '\n';
                                            }
                                        }
                                    }
                                    Bot_msg_push(msg.chat.id, msg.message_id);
                                    bot.sendMessage(msg.from.id, 'Wordpress плагин успешно добавлен!\n*Wordpress плагины:*\n' + html, html_Markdown);
                                }
                            });
                        }
                    });
                }, 500);
            });
        } else {
            send_err(err, 'Неправильный запрос /wp_add msg[' + msg + ']');
            Bot_msg_push(msg.chat.id, msg.message_id);
            bot.sendMessage(msg.from.id, 'Запрос не правильный /*wp_add* (cat_number) (добавляемый текст разметка:Markdown)*');
        }
    }
});


bot.onText(/\/wp_plugins( this)?/, (msg, match) => {
    if (!is_bloklist(msg.from.id)) {
        var msg_id = msg.message_id;

        WP_plugin.find(function(err, data) {
            if (err) {
                log(err);
            } else {
                WP_category.find(function(err, data_category) {
                    if (err) {
                        log(err);
                    } else {
                        var html = '';
                        for (var c = 0; c < data_category.length; c++) {
                            html += '\n*' + data_category[c].name + '*\n';
                            for (var i = 0; i < data.length; i++) {
                                if (data[i].cat == data_category[c].cat) {
                                    html += data[i].txt + '\n';
                                }
                            }
                        }
                        if (isset(match[1])) {
                            Bot_msg_push(msg.chat.id, msg.message_id);
                            bot.sendMessage(msg.chat.id, '*Wordpress плагины:*\n' + html + '', html_Markdown);
                            bot.deleteMessage(msg.chat.id, msg_id, function(err, mess) {
                                if (err) {
                                    log('Не могу удалитьсообение, не хватает прав!');
                                }
                            });
                        } else {
                            Bot_msg_push(msg.chat.id, msg.message_id);
                            bot.sendMessage(msg.from.id, '*Wordpress плагины:*\n' + html + '', html_Markdown);
                            bot.deleteMessage(msg.chat.id, msg_id, function(err, mess) {
                                if (err) {
                                    log('Не могу удалитьсообение, не хватает прав!');
                                }
                            });
                        }
                    }
                });
            }
        });
    }
});

//### WP // /wp_category (cat number)  (category Name - Markdown)
bot.onText(/\/wp_category([\s]*([\w]+)[,\s]+([^\'\"]+))?/, function(msg, match) {
    if (!is_bloklist(msg.from.id)) {
        if (isset(match[1])) {
            if (isset(match[2]) && isset(match[3])) {

                var send_data = new WP_category({
                    cat: match[2],
                    name: match[3]
                });
                send_data.save(function(err, send_data, num) {
                    if (err) {
                        send_err(err, 'Ошибка записи данных в mongodb:WP_plugin');
                        return console.error(err);
                    }

                    log('Wordpress плагин успешно добавлен!\n');
                    //bot.sendMessage(msg.from.id, 'Wordpress плагин успешно добавлен!');

                    setTimeout(function() {
                        WP_category.find(function(err, data_category) {
                            if (err) {
                                send_err(err, 'при поиске данных в mongodb:WP_category');
                            } else {
                                var html = '';
                                for (var c = 0; c < data_category.length; c++) {
                                    html += 'cat: ' + data_category[c].cat + ' *' + data_category[c].name + '*\n';
                                }
                                Bot_msg_push(msg.chat.id, msg.message_id);
                                bot.sendMessage(msg.from.id, '*Новая категория успешно добавлена в базу ;)*\n\n*Wordpress категории:*\n' + html, html_Markdown);
                            }
                        });
                    }, 500);
                });
            } else {
                send_err(err, 'Неправильный запрос /wp_category msg[' + msg + ']');
                Bot_msg_push(msg.chat.id, msg.message_id);
                bot.sendMessage(msg.from.id, 'Запрос не правильный /*wp_category* (cat_number) (добавляемый текст разметка:Markdown)*');
            }

        } else {
            WP_category.find(function(err, data_category) {
                if (err) {
                    send_err(err, 'при поиске данных в mongodb:WP_category');
                } else {
                    var html = '';
                    for (var c = 0; c < data_category.length; c++) {
                        html += 'cat: ' + data_category[c].cat + ' *' + data_category[c].name + '*\n';
                    }
                    Bot_msg_push(msg.chat.id, msg.message_id);
                    bot.sendMessage(msg.from.id, '*Wordpress категории:*\n' + html, html_Markdown);
                }
            });
        }
    }
});



bot.onText(/\/clear/, function(msg, match) {
    if (!is_bloklist(msg.from.id)) {

        var chat_id = msg.chat.id;
        if (msg.from.id == Config.admin_id) {
            log('clear от Администратора');
            //log(global.bot_msgs);

            for (var i = 0; i < global.bot_msgs.length; i++) {
                if (global.bot_msgs[i].chat_id == msg.chat.id) {
                    bot.deleteMessage(msg.chat.id, global.bot_msgs[i].msg_id);
                    log(msg.chat.id + global.bot_msgs[i].msg_id);
                }
            }
            for (var i = 0; i < global.bot_msgs.length; i++) {
                if (global.bot_msgs[i].chat_id == msg.chat.id) {
                    global.bot_msgs.splice(i, 1);
                }
            }

        } else {
            bot.deleteMessage(msg.chat.id, 'Ваш уровень доступа не позволяет мне реагировать на эту команду, а у меня нет прав на их удаления.');
        }
    }
});

//BACKUP data
bot.onText(/\/export (wp_category|wp_plugins)/i, function(msg, match){
    if (msg.from.id == Config.admin_id) {

        if (match[1] == 'wp_category') {
            WP_category.find(function(err, wp_category) {
                if (err) {
                    log(err);
                } else {
                    data_arr = JSON.stringify(wp_category, "", 2);

                    fs.writeFile('backup/wp_categories.json', data_arr, 'utf8', function(err) {
                        if (err) {
                            log(err);
                        } else {
                            var send_text = 'Коллекция wp_categories экспортирована в /backup/wp_categories.json!';
                            BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                        }
                    });
                }
            });
        } 

        if (match[1] == 'wp_plugins') {
            WP_plugin.find(function(err, wp_plugins) {
                if (err) {
                    log(err);
                } else {
                    data_arr = JSON.stringify(wp_plugins, "", 2);

                    fs.writeFile('backup/wp_plugins.json', data_arr, 'utf8', function(err) {
                        if (err) {
                            log(err);
                        } else {
                            var send_text = 'Коллекция wp_plugins экспортирована в /backup/wp_plugins.json!';
                            BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                        }
                    });
                }
            });
        }
    }
});

bot.onText(/\/import (wp_category|wp_plugins)/i, function(msg, match) {
    if (msg.from.id == Config.admin_id) {

        if (match[1] == 'wp_category') {

            fs.readFile('backup/wp_categories.json', 'utf8', function(err, data) {
                if (err) {
                    var send_text = 'Ошибка чтения файла backup/wp_categories.json';
                    BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                    throw err;
                }

                var send_arr = JSON.parse(data);

                WP_category.insertMany(send_arr, function(err, docs) {
                    if (err) {
                        var send_text = 'Ошибка сохранения в базу из файла backup/wp_categories.json';
                        BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                        log(err);
                    } else {
                        var send_text = 'Данные из файла backup/wp_categories.json успешно сохраненены в базу';
                        BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                    }
                });
            });
        }

        if (match[1] == 'wp_plugins') {

            fs.readFile('backup/wp_plugins.json', 'utf8', function(err, data) {
                if (err) {
                    var send_text = 'Ошибка чтения файла backup/wp_plugins.json';
                    BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                    throw err;
                }

                var send_arr = JSON.parse(data);

                WP_plugin.insertMany(send_arr, function(err, docs) {
                    if (err) {
                        var send_text = 'Ошибка сохранения в базу из файла backup/wp_plugins.json';
                        BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                        log(err);
                    } else {
                        var send_text = 'Данные из файла backup/wp_plugins.json успешно сохраненены в базу';
                        BOT_send_msg(msg.chat.id, msg.message_id, send_text, silent_and_no_previw);
                    }
                });
            });
        }
    }
});

var info_html = 'Официальный сайт Wordpress:\n' +
    '[wordpress.org](https://wordpress.org) и [ru.wordpress.org](https://ru.wordpress.org)\n' +
    '[Wordpress Плагины](https://ru.wordpress.org/plugins)\n' +
    '[Wordpress Темы](https://ru.wordpress.org/themes)\n\n' +
    '[Wordpress Кодекс:ru](https://codex.wordpress.org/ru:Main_Page)\n' +
    '[Wordpress Кодекс на wp-kama.ru](https://wp-kama.ru/cat/wordpress/codex)\n' +
    '[wp-kama.ru:functions](https://wp-kama.ru/functions)\n\n' +
    'Wordpress последняя версия: [latest-ru_RU.zip](https://ru.wordpress.org/latest-ru_RU.zip)\n' +
    '\nКоманды боту: \n' +
    '/*wp info* - Общая информаиця (это сообщение)\n' +
    '/*wp plugins* - Линк на страницу `wordpress.org/plugins`\n' +
    '/*wp plugins plugin-name* - Линк на страницу `wordpress.org/plugins/search/plugin-name`\n' +
    '/*wp zip* - ссылка на zip с wordpress последней версии\n' +
    '/*wp lates* - ссылка на zip с wordpress последней версии\n' +
    '/*wp_plugins* - Список плагинов wordpress в личку\n' +
    '/*wp_plugins this* - Список плагинов wordpress в текущий чат\n' +
    '/*js_plugins* - Список плагинов jquery\n' +
    '\n*Добавление wordpress плагинов самим:*\n' +
    '/*wp_category* - Список добавленных категорий для *wp_plugins*\n' +
    '\n*Добавление категории в wp_plugins*:\n/*wp_category add* cat:(number), name:(название формат Markdown)\n' +
    '\n*Добавленных плагина в wp_plugins*:\n/*wp_add* cat:(category-number), text:(текст формат Markdown)\n' +
    '\n*Добавление jquery плагинов самим:*\n' +
    '/*js_category* - Список добавленных категорий для *js_plugins*\n' +
    '\n*Добавление категории в js_plugins*:\n/*js_category add* cat:(number), name:(название формат Markdown)\n' +
    '\n*Добавленных плагина в js_plugins*:\n/*js_add* cat:(category-number), text:(текст формат Markdown)\n' +
    '';



bot.onText(/\/start/, function(msg, match) {
    if (!is_bloklist(msg.from.id)) {
        Bot_msg_push(msg.chat.id, msg.message_id);
        bot.sendMessage(msg.chat.id, info_html, html_Markdown);
    }
});

bot.onText(/\/[wpok]+ (yandex|y[a]*|google|g[o]*|plugin[s]?|.+)( (.*))?/i, function(msg, match) {

    if (!is_bloklist(msg.from.id)) {
        //log(msg);
        if (isset(match[1])) {
            var wp_comand = match[1].toLowerCase();
            if (wp_comand == 'info') {
                Bot_msg_push(msg.chat.id, msg.message_id);
                bot.sendMessage(msg.chat.id, info_html, html_Markdown);
            }

            if (wp_comand == 'linux cmd') {
                Bot_msg_push(msg.chat.id, msg.message_id);
                bot.sendMessage(msg.chat.id, 'http://dobryjhosting.ru/vps-vds/linux-commands', silent_and_no_preview);
            }

            if (wp_comand == 'plugin') {
                if (isset(match[3])) {
                    Bot_msg_push(msg.chat.id, msg.message_id);
                    bot.sendMessage(msg.chat.id, 'https://wordpress.org/plugins/' + match[3].toLowerCase().replace(/[\s]+/gi, "-"), silent_and_no_preview);
                }
            } else if (wp_comand == 'plugins') {
                if (isset(match[3])) {
                    Bot_msg_push(msg.chat.id, msg.message_id);
                    bot.sendMessage(msg.chat.id, 'https://wordpress.org/plugins/search/' + match[3].toLowerCase(), silent_and_no_preview);
                } else {
                    Bot_msg_push(msg.chat.id, msg.message_id);
                    bot.sendMessage(msg.chat.id, 'https://wordpress.org/plugins/search/', silent_and_no_preview);
                }
            }
            // /(ok|wp)   (y|ya|yandex|g|go|google)    (поисковой запрос)
            if (/google|g[o]*/.test(wp_comand)) {
                if (isset(match[3])) {
                    Bot_msg_push(msg.chat.id, msg.message_id);
                    bot.sendMessage(msg.chat.id, 'https://www.google.ru/search?q=' + match[3].replace(/[\s]+/gi, "+"), silent_and_no_preview);
                }
            }

            if (/yandex|y[a]*/.test(wp_comand)) {
                if (isset(match[3])) {
                    Bot_msg_push(msg.chat.id, msg.message_id);
                    bot.sendMessage(msg.chat.id, 'https://yandex.ru/search/?text=' + match[3].replace(/[\s]+/gi, "%20"), silent_and_no_preview);
                }
            }

            if (wp_comand == 'latest') {
                Bot_msg_push(msg.chat.id, msg.message_id);
                bot.sendMessage(msg.chat.id, 'https://ru.wordpress.org/latest-ru_RU.zip', silent_and_no_preview);
            }
        }
    }
});
