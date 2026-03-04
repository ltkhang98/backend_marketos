const { handleEditor } = require('destack/build/server');

async function test() {
    const req = {
        method: 'GET',
        query: { type: 'data' },
        url: '/api/builder/handle?type=data',
        headers: { host: 'localhost:3000' }
    };
    const res = {
        setHeader: () => { },
        status: function (code) { console.log('Status set:', code); return this; },
        json: function (data) { console.log('JSON sent:', data); return this; },
        send: function (data) { console.log('Text sent:', data); return this; },
        end: function () { console.log('Response ended'); }
    };

    try {
        process.env.NODE_ENV = 'development';
        await handleEditor(req, res);
    } catch (err) {
        console.error('Builder error:', err);
    }
}

test();
