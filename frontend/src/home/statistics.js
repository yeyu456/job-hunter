
let canvas = document.getElementById('canvas');
canvas.width = canvas.parentNode.clientWidth;
canvas.height = canvas.parentNode.parentNode.clientHeight;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let ctx = canvas.getContext('2d');


function toDegrees (angle) {
    return angle * (180 / Math.PI);
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

class Point {

    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x;
    }

    set x(v) {
        this._x = x;
    }

    get y() {
        return this._y;
    }

    set y(v) {
        this._y = v;
    }

}

class RegularHexagon {

    constructor(ctx, centerPoint, len) {
        this.ctx = ctx;
        this.center = centerPoint;
        this.len = len;
    }

    _getAllPoint(len,center) {
        let points = [];
        let p1 = new Point(Math.round(center.x - (len / 2) * Math.tan(toRadians(60))),
            Math.round(center.y - len / 2));
        let xLen = len * Math.cos(toRadians(30));
        let yLen = len * Math.sin(toRadians(30));
        points.push(p1);
        points.push(new Point(Math.round(p1.x + xLen), Math.round(p1.y - yLen)));
        points.push(new Point(Math.round((p1.x + xLen * 2)), p1.y));
        points.push(new Point(Math.round((p1.x + xLen * 2)), Math.round(p1.y + len)));
        points.push(new Point(Math.round(p1.x + xLen), Math.round(p1.y + yLen + len)));
        points.push(new Point(p1.x, Math.round(p1.y + len)));
        return points;
    }

    _getAllBigPoint(len, center) {
        let points = [];
        let xLen = len * Math.sin(toRadians(30));
        let yLen = len * Math.cos(toRadians(30));
        points.push(new Point(Math.round(center.x - len), center.y));
        points.push(new Point(Math.round(center.x - xLen), Math.round(center.y - yLen)));
        points.push(new Point(Math.round(center.x + xLen), Math.round(center.y - yLen)));
        points.push(new Point(Math.round(center.x + len), center.y));
        points.push(new Point(Math.round(center.x + xLen), Math.round(center.y + yLen)));
        points.push(new Point(Math.round(center.x - xLen), Math.round(center.y + yLen)));
        return points;
    }

    render() {
        let bLen = 10 + 60 * 2 * Math.cos(toRadians(30));
        let points = this._getAllBigPoint(bLen, this.center);
        let texts = ['数量', '地区', '工资', '年限', '行业', '关键词'];
        let colors = [
            'rgb(45, 48, 53)',
            'rgb(239, 58, 1)',
            'rgb(144, 180, 75)',
            'rgb(251, 226, 80)',
            'rgb(255, 219, 183)',
            'rgb(251, 255, 254'];
        this.ctx.lineWidth = 1;
        let texture = new Image();
        texture.src = './../../assets/texture.png';
        texture.onload = () => {
            for(let i=0;i<points.length;i++) {
                this.ctx.fillStyle = colors[i];
                let subPoints = this._getAllPoint(this.len, points[i]);
                this.ctx.beginPath();
                this.ctx.moveTo(subPoints[0].x, subPoints[0].y);
                for (let sp of subPoints) {
                    this.ctx.lineTo(sp.x, sp.y);
                }
                this.ctx.lineTo(subPoints[0].x, subPoints[0].y);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.fillStyle = 'rgb(197, 194, 187)';
                this.ctx.font = "20px serif";
                this.ctx.fillText(texts[i], points[i].x - this.len / 3, points[i].y);
            }
        };
    }
}

let r = new RegularHexagon(ctx, new Point(centerX, centerY), 60);
r.render();