const result = {
  id: 1,
  name: 'Links',
  links: [
    {
      node_uuid: '6f553e7b-a52d-4638-8b19-9e6e5ebed4dd',
      action_uuid: 'd8ddd46f-8e96-46bf-a46f-626a3d275dd6',
      link: 'https://google.com',
      status_code: 200
    },
    {
      node_uuid: '6f553e7b-a52d-4638-8b19-9e6e5ebed4dd',
      action_uuid: 'd8ddd46f-8e96-46bf-a46f-626a3d275dd6',
      link: 'https://twitter.com',
      status_code: 200
    },
    {
      node_uuid: '858f78c9-ff10-4e19-83ab-10762320f8db',
      action_uuid: '49e2047b-9dc6-4ae9-b9be-6607488357f4',
      link: 'https://hauyfjwgfjw.com/',
      status_code: 400,
      error: 'A Connection error occurred.'
    }
  ]
};
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify(result) }));
