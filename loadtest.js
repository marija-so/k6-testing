import { check, group, sleep } from 'k6';
import uuid from './uuid.js'
import http from 'k6/http';

const config = JSON.parse(open("config.json"));
const theseus_url = `${config.theseus_url}`;

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Token 056449eb497b588799683f59dfa3e118b2882d6e"
};

export const options = {
  stages: [
    {duration: '1m', target: 100}, // ramp up 
    {duration: '1m', target: 100}, // stable 
    // {duration: '30s', target: 200}, // up 
    // {duration: '30s', target: 200}, // stable
    // {duration: '30s', target: 200}, // stable 
    // {duration: '30s', target: 300}, // ramp down
    // {duration: '30s', target: 300}, // ramp up 
    // {duration: '30s', target: 400}, // stable 
    {duration: '30s', target: 0}, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<100'], // 99% of requests must complete within 100ms
    http_reqs: ['count < 1000'],
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  }
};

export default function () {
  let res;
  let params;

  // Three different requests here: 
  // - 404 with randomly generated invalid merchant ids
  // - 200 on a valid merchant id
  // - 200 with a valid merchant id and business id
  group('Get Flow', function (){
    let business_location_id;
    let url = '/merchants/business-location-id/';

    let merchant_id = uuid.v1();
    url = url + `?merchant_id=${merchant_id}`;
    res = http.request("GET", theseus_url+ url, params, {headers: headers});
    sleep(1);

    check(res, {
      // using a random UUID for merchant
      'is status 404': (r) => r.status === 404,
    });
    // console.log(res)

    merchant_id = "650d9f7d4ad5a900388f9614";
    url = '/merchants/business-location-id/';
    url = url + `?merchant_id=${merchant_id}`;
    res = http.request("GET", theseus_url+ url, params, {headers: headers});
    sleep(1);

    check(res, {
      //check active merch is good
      'is status 200': (r) => r.status === 200,
    });
    // console.log(res)

    business_location_id = "650d9f7d4ad5a900388f9614";
    url = '/merchants/business-location-id/';
    url = url + `?business_location_id=${business_location_id}`;
    res = http.request("GET", theseus_url+ url, params, {headers: headers});
    sleep(1);

    check(res, {
      // check active biz ID is good
      'is status 200': (r) => r.status === 200,
    });
    // console.log(res)

    url = url + `&merchant_id=${merchant_id}`;
    res = http.request("GET", theseus_url+ url, params, {headers: headers});
    sleep(1);

    check(res, {
      // check that both provided is good
      'is status 200': (r) => r.status === 200,
    });
    // console.log(res)
  });
} 
