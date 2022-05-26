const results = [
  { id: 'basic-text-test', text: 'Basic Text Test' },
  { id: 'basic-voice-test', text: 'Basic Voice Test' }
];
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify({ results }) }));
