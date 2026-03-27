
const axios = require('axios');
require('dotenv').config();

async function testV5() {
    console.log('Testing v5 (Raw Text)...');
    try {
        const res = await axios({
            method: 'post',
            url: 'https://api.fpt.ai/hmi/tts/v5',
            data: 'Chào bạn, đây là thử nghiệm hệ thống lồng tiếng AI.',
            headers: {
                'api_key': process.env.FPT_AI_API_KEY,
                'voice': 'banmai',
                'speed': '0',
                'Content-Type': 'text/plain'
            }
        });
        console.log('V5 Success:', res.data);
    } catch (err) {
        console.error('V5 Error:', err.response ? err.response.status : err.message);
    }
}

async function testV5Json() {
    console.log('Testing v5 (JSON Object)...');
    try {
        const res = await axios({
            method: 'post',
            url: 'https://api.fpt.ai/hmi/tts/v5',
            data: {
                text: 'Chào bạn, đây là thử nghiệm hệ thống lồng tiếng AI.',
                voice: 'banmai',
                speed: '0'
            },
            headers: {
                'api_key': process.env.FPT_AI_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log('V5 JSON Success:', res.data);
    } catch (err) {
        console.error('V5 JSON Error:', err.response ? err.response.status : err.message);
    }
}

async function testV3() {
    console.log('Testing v3 (Params)...');
    try {
        const params = new URLSearchParams();
        params.append('text', 'Chào bạn, đây là thử nghiệm hệ thống lồng tiếng AI.');
        const res = await axios.post('https://api.fpt.ai/hmi/tts/v3', params.toString(), {
            headers: {
                'api_key': process.env.FPT_AI_API_KEY,
                'voice': 'banmai',
                'speed': '0',
            }
        });
        console.log('V3 Success:', res.data);
    } catch (err) {
        console.error('V3 Error:', err.response ? err.response.status : err.message);
    }
}

testV5().then(testV5Json).then(testV3);
