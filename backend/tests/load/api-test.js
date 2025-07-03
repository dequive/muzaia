import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'https://api.muzaia.mz';

export default function () {
  group('API Endpoints', () => {
    check(http.get(`${BASE_URL}/health`), {
      'Health check OK': (r) => r.status === 200,
    });
    sleep(1);
  });
}
