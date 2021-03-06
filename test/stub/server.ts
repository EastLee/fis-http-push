import {URLSearchParams} from 'url';
import nock from 'nock';
import {debug} from '../../src/util/log';
import {EMAIL, TOKEN, CODE} from './token';

export const receiver = 'http://localhost:1080';

export const serverFileSystem = new Map();

export let maxConcurrent = 0;

let concurrent = 0;

export function startServer() {
    serverFileSystem.clear();
    concurrent = 0;
    maxConcurrent = 0;
    nock('http://localhost:1080')
        .persist()
        .post('/v1/upload').reply(upload)
        .post('/v1/authorize').reply(authorize)
        .post('/v1/validate').reply(validate);
}
function upload(uri, body, cb) {
    concurrent++;
    maxConcurrent = Math.max(concurrent, maxConcurrent);
    setTimeout(() => {
        const contentType = this.req.getHeader('content-type');
        if (typeof contentType !== 'string') {
            return cb(null, [400, {'errno': '100023', 'errmsg': 'no content-type'}]);
        }
        const email = getField('email', body);
        const code = getField('code', body);
        const token = getField('token', body);
        const to = getField('to', body);
        const fileContent = getField('file', body);

        if (email !== EMAIL) {
            debug(`responding invalid email: "${email}" !== "${EMAIL}"`);
            return cb(null, [200, {'errno': 100305, 'errmsg': 'invalid email'}]);
        }
        else if (token !== TOKEN || code !== CODE) {
            debug('responding invalid token');
            return cb(null, [200, {'errno': 100305, 'errmsg': 'invalid token'}]);
        }
        else if (to === '/unkown-error') {
            debug('responding unkown error');
            return cb(null, [500, 'UNKOWN']);
        }
        else if (!/^\/tmp\//.test(to)) {
            debug('responding invalid path');
            return cb(null, [200, {'errno': 100503, 'errmsg': '未授权的文件部署路径，请加入配置白名单中'}]);
        }

        const size = Buffer.from(fileContent).length;
        debug(`file "${to}" added, responding success`);
        serverFileSystem.set(to, fileContent);
        concurrent--;
        return cb(null, [200, {errno: 0, msg: `${size} bytes uploaded`}]);
    });
}

function authorize(uri, body: string) {
    const params = new URLSearchParams(body);
    if (params.get('email') !== EMAIL) {
        return [200, {'errno': 100004, 'errmsg': 'invalid email'}];
    }
    return [200, {errno: 0, msg: `code sent to ${EMAIL}`}];
}

function validate(uri, body: string) {
    const params = new URLSearchParams(body);
    if (params.get('email') !== EMAIL) {
        return [200, {'errno': 100005, 'errmsg': 'invalid email'}];
    }
    if (params.get('code') !== CODE) {
        return [200, {'errno': 100006, 'errmsg': 'invalid code'}];
    }
    return [200, {errno: 0, data: {token: TOKEN}}];
}

function getField(name, body) {
    const match = body.match(new RegExp(`name="${name}"[^\r]*\r\n\r\n([^\r]*)\r\n`));
    return match && match[1];
}
