
module.exports = class BaseError {

    constructor(msgOrErr, extraMsg) {
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        if (Object.prototype.toString.call(msgOrErr) === '[object Error]') {
            this.stack = msgOrErr.stack;
            this.message = msgOrErr.message + '\n' + extraMsg;

        } else {
            this.message = msgOrErr + '\n' + extraMsg;
        }
    }

    toString() {
        let date = new Date();
        return '[' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() +
            ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']\n' +
            this.message;
    }
};