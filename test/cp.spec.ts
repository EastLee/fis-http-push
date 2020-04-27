import mock from 'mock-fs';
import {cp} from '../src';
import {clear, FHP_TOKEN_FILE} from '../src/token';
import {startServer, receiver, serverFileSystem} from './stub/server';
import {TOKEN_FILE_CONTENT} from './stub/token';

describe('fcp', () => {
    beforeEach(() => {
        clear();
        startServer();
    });
    afterEach(() => mock.restore());

    it('文件到文件', async () => {
        mock({'/foo.txt': 'FOO', [FHP_TOKEN_FILE]: TOKEN_FILE_CONTENT});
        await cp('/foo.txt', '/tmp/foo.txt', {receiver});
        expect(serverFileSystem.get('/tmp/foo.txt')).toEqual('FOO');
    });

    it('目录到目录（不带/）', async () => {
        mock({
            foo: {
                'foo.txt': 'FOO',
                'bar.txt': 'BAR',
                'coo.txt': 'COO'
            },
            [FHP_TOKEN_FILE]: TOKEN_FILE_CONTENT
        });
        await cp('foo', '/tmp/foo', {receiver, recursive: true});
        expect(serverFileSystem.get('/tmp/foo/foo.txt')).toEqual('FOO');
        expect(serverFileSystem.get('/tmp/foo/bar.txt')).toEqual('BAR');
        expect(serverFileSystem.get('/tmp/foo/coo.txt')).toEqual('COO');
    });

    it('目录到目录（带/）', async () => {
        mock({
            foo: {
                'foo.txt': 'FOO',
                'bar.txt': 'BAR',
                'coo.txt': 'COO'
            },
            [FHP_TOKEN_FILE]: TOKEN_FILE_CONTENT
        });
        await cp('foo', '/tmp/bar/', {receiver, recursive: true});
        expect(serverFileSystem.get('/tmp/bar/foo/foo.txt')).toEqual('FOO');
        expect(serverFileSystem.get('/tmp/bar/foo/bar.txt')).toEqual('BAR');
        expect(serverFileSystem.get('/tmp/bar/foo/coo.txt')).toEqual('COO');
    });

    it('多源文件到目录（不带/）', async () => {
        mock({
            'foo.txt': 'FOO',
            foo: {
                'bar.txt': 'BAR',
                'coo.txt': 'COO'
            },
            [FHP_TOKEN_FILE]: TOKEN_FILE_CONTENT
        });
        await cp(['foo.txt', 'foo'], '/tmp/bar', {receiver, recursive: true});
        expect(serverFileSystem.get('/tmp/bar/foo.txt')).toEqual('FOO');
        expect(serverFileSystem.get('/tmp/bar/foo/bar.txt')).toEqual('BAR');
        expect(serverFileSystem.get('/tmp/bar/foo/coo.txt')).toEqual('COO');
    });

    it('多源文件到目录（带/）', async () => {
        mock({
            'foo.txt': 'FOO',
            foo: {
                'bar.txt': 'BAR',
                'coo.txt': 'COO'
            },
            [FHP_TOKEN_FILE]: TOKEN_FILE_CONTENT
        });
        await cp(['foo.txt', 'foo'], '/tmp/bar/', {receiver, recursive: true});
        expect(serverFileSystem.get('/tmp/bar/foo.txt')).toEqual('FOO');
        expect(serverFileSystem.get('/tmp/bar/foo/bar.txt')).toEqual('BAR');
        expect(serverFileSystem.get('/tmp/bar/foo/coo.txt')).toEqual('COO');
    });

    it('源文件各种语法', async () => {
        mock({
            'foo.txt': 'FOO',
            foo: {
                'bar.txt': 'BAR',
                'coo.txt': 'COO'
            },
            [FHP_TOKEN_FILE]: TOKEN_FILE_CONTENT
        });
        await cp(['./foo.txt', 'foo/bar.txt', './foo/coo.txt'], '/tmp/bar', {receiver, recursive: true});
        expect(serverFileSystem.get('/tmp/bar/foo.txt')).toEqual('FOO');
        expect(serverFileSystem.get('/tmp/bar/foo/bar.txt')).toEqual('BAR');
        expect(serverFileSystem.get('/tmp/bar/foo/coo.txt')).toEqual('COO');
    });
});
