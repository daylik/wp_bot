var config = {
	"token": "тут токен бота",
	"admin_id": 'id администратора',
	"err_send_admin": true,
	"err_send_msg": true,
	"err_logger": true,
 	"port": 3000,
	"mongoose": {
		"url": "localhost:27017/daylike_bot",
		"user": "",
		"pass": "",
		"options": { "server": { "socketOptions": { "keepAlive": true }}}
	}
};

module.exports = config;