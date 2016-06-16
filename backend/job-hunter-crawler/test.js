const EventEmitter = require('events');
const request = require('request');

let count = 0;
function test(){
    let options = {
        //url: 'http://www.lagou.com/jobs/positionAjax.json?city=%E4%B8%8A%E6%B5%B7&needAddtionalResult=false',
        proxy: 'http://112.65.200.211',
        url: 'http://www.bing.com',
        headers: {
            //'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        },
        //form: {first: true, pn: 1, kd: 'Java'}
        //, followRedirect:false
    };
    request.get(options, (error, response, body)=>{
        console.log(response);
        console.log(response);
        if (count > 3) {
            return;
        } else {
            count++;
            //setTimeout(test, 3000 * count);
        }
    })
}
test()
// let p1 = new Promise((r1, j1) => {
//     r1();
// });
// let count1 = 1;
// let eventObj = new EventEmitter();
// p1.then(()=>{
//     return new Promise((resolve, reject) => {
//         console.log('r2');
//         eventObj.on('event', ()=>{
//             console.log('r22');
//             resolve();
//         });
//
//     }).then(()=>{
//         console.log('r3');
//     });
// }).then(()=>{
//     console.log('r11');
// });
// function t1(){
//     return count1++;
// }
// function t2() {
//     console.log(count1);
//     setTimeout(()=>{
//         if (t1()=== 3) {
//             eventObj.emit('event');
//         } else {
//             t2();
//         }
//     }, 1000);
// }
// t2();
