
const request = require('request');

let count = 0;
function test(){
    let options = {
        url: 'http://www.lagou.com/jobs/positionAjax.json?city=%E4%B8%8A%E6%B5%B7&needAddtionalResult=false',
        //url: 'http://www.bing.com',
        headers: {
            http_proxy: 'http://112.65.200.211',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        },
        form: {first: true, pn: 1, kd: 'Java'}
        //, followRedirect:false
    };
    request.post(options, (error, response, body)=>{
        console.log(response.headers);
        console.log(response.headers['Set-Cookie']);
        console.log(response.statusCode);
        if (count > 3) {
            return;
        } else {
            count++;
            //setTimeout(test, 3000 * count);
        }
    })
}
test();
