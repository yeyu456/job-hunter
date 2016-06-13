

export default class Task {

    constructor(url) {
        this._startPageNum = 1;
        this._maxPageNum = 1;
        this._url = url;
    }

    get maxPageNum() {
        return this._maxPageNum;
    }

    set maxPageNum(num) {
        this._maxPageNum = num;
    }

    get startPageNum() {
        if (this.startPageNum > this._maxPageNum) {
            return null;
        } else {
            let tmp = this._startPageNum;
            this._startPageNum++;
            return tmp;
        }
    }

    set startPageNum(num) {
        if (num < 1) {
            return;
        }
        this._startPageNum = num;
    }

    get url() {
        return this._url;
    }
}
