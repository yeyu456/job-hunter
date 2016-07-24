
let canvas = document.getElementById('canvas');
canvas.width = canvas.parentNode.clientWidth;
canvas.height = canvas.parentNode.parentNode.clientHeight;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let ctx = canvas.getContext('2d');

let texts = ['0xe230', '0xe062', '0xa5', '0xe023', '0xe139', '0xe003'];

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

    _onHover(points, center) {
        document.getElementById('canvas').addEventListener('mouseenter', (e) => {
            let sLen = (this.len / 2) * Math.tan(toRadians(60));
            if (e.offsetX > center.x + sLen) {
                return;
            } else if (e.offsetX < center.x - sLen) {
                return;
            } else if (e.offsetY > center.y + sLen) {
                return;
            } else if (e.offsetY < center.y - sLen) {
                return;
            }
        });
    }

    render() {
        let bLen = 10 + 60 * 2 * Math.cos(toRadians(30));
        let points = this._getAllBigPoint(bLen, this.center);
        let colors = [
            'rgb(45, 48, 53)',
            'rgb(255, 73, 104)',
            'rgb(255, 226, 73)',
            'rgb(73, 255, 134)',
            'rgb(73, 195, 255)',
            'rgb(134, 73, 255'];
        this.ctx.lineWidth = 1;
        this.ctx.font = "25px Glyphicons Halflings";
        let font = new Font();
        //this.ctx.fillText('', 10, 10);
        font.onload = () => {
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
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(String.fromCharCode(texts[i]), points[i].x - this.len / 4, points[i].y + 10);
            }
        };
        font.fontFamily = 'Glyphicons Halflings';
        font.src = './../../libs/bootstrap/fonts/glyphicons-halflings-regular.ttf'
    }
}

let r = new RegularHexagon(ctx, new Point(centerX, centerY), 60);
r.render();
