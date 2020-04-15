export const completion = {
  types: [
    {
      name: 'fields',
      key_source: 'fields',
      property_template: {
        key: '{key}',
        help: '{key} for the contact',
        type: 'any'
      }
    },
    {
      name: 'results',
      key_source: 'results',
      property_template: {
        key: '{key}',
        help: 'result for {key}',
        type: 'result'
      }
    },
    {
      name: 'urns',
      properties: [
        {
          key: 'ext',
          help: 'Ext URN for the contact',
          type: 'text'
        },
        {
          key: 'facebook',
          help: 'Facebook URN for the contact',
          type: 'text'
        },
        {
          key: 'fcm',
          help: 'Fcm URN for the contact',
          type: 'text'
        },
        {
          key: 'jiochat',
          help: 'Jiochat URN for the contact',
          type: 'text'
        },
        {
          key: 'line',
          help: 'Line URN for the contact',
          type: 'text'
        },
        {
          key: 'mailto',
          help: 'Mailto URN for the contact',
          type: 'text'
        },
        {
          key: 'tel',
          help: 'Tel URN for the contact',
          type: 'text'
        },
        {
          key: 'telegram',
          help: 'Telegram URN for the contact',
          type: 'text'
        },
        {
          key: 'twitter',
          help: 'Twitter URN for the contact',
          type: 'text'
        },
        {
          key: 'twitterid',
          help: 'Twitterid URN for the contact',
          type: 'text'
        },
        {
          key: 'viber',
          help: 'Viber URN for the contact',
          type: 'text'
        },
        {
          key: 'wechat',
          help: 'Wechat URN for the contact',
          type: 'text'
        },
        {
          key: 'whatsapp',
          help: 'Whatsapp URN for the contact',
          type: 'text'
        }
      ]
    },
    {
      name: 'channel',
      properties: [
        {
          key: '__default__',
          help: 'the name',
          type: 'text'
        },
        {
          key: 'uuid',
          help: 'the UUID of the channel',
          type: 'text'
        },
        {
          key: 'name',
          help: 'the name of the channel',
          type: 'text'
        },
        {
          key: 'address',
          help: 'the address of the channel',
          type: 'text'
        }
      ]
    },
    {
      name: 'contact',
      properties: [
        {
          key: '__default__',
          help: 'the name or URN',
          type: 'text'
        },
        {
          key: 'uuid',
          help: 'the UUID of the contact',
          type: 'text'
        },
        {
          key: 'id',
          help: 'the numeric ID of the contact',
          type: 'text'
        },
        {
          key: 'first_name',
          help: 'the first name of the contact',
          type: 'text'
        },
        {
          key: 'name',
          help: 'the name of the contact',
          type: 'text'
        },
        {
          key: 'language',
          help: 'the language of the contact as 3-letter ISO code',
          type: 'text'
        },
        {
          key: 'created_on',
          help: 'the creation date of the contact',
          type: 'datetime'
        },
        {
          key: 'urns',
          help: 'the URNs belonging to the contact',
          type: 'text',
          array: true
        },
        {
          key: 'urn',
          help: 'the preferred URN of the contact',
          type: 'text'
        },
        {
          key: 'groups',
          help: 'the groups the contact belongs to',
          type: 'group',
          array: true
        },
        {
          key: 'fields',
          help: 'the custom field values of the contact',
          type: 'fields'
        },
        {
          key: 'channel',
          help: 'the preferred channel of the contact',
          type: 'channel'
        }
      ]
    },
    {
      name: 'flow',
      properties: [
        {
          key: '__default__',
          help: 'the name',
          type: 'text'
        },
        {
          key: 'uuid',
          help: 'the UUID of the flow',
          type: 'text'
        },
        {
          key: 'name',
          help: 'the name of the flow',
          type: 'text'
        },
        {
          key: 'revision',
          help: 'the revision number of the flow',
          type: 'text'
        }
      ]
    },
    {
      name: 'group',
      properties: [
        {
          key: 'uuid',
          help: 'the UUID of the group',
          type: 'text'
        },
        {
          key: 'name',
          help: 'the name of the group',
          type: 'text'
        }
      ]
    },
    {
      name: 'input',
      properties: [
        {
          key: '__default__',
          help: 'the text and attachments',
          type: 'text'
        },
        {
          key: 'uuid',
          help: 'the UUID of the input',
          type: 'text'
        },
        {
          key: 'created_on',
          help: 'the creation date of the input',
          type: 'datetime'
        },
        {
          key: 'channel',
          help: 'the channel that the input was received on',
          type: 'channel'
        },
        {
          key: 'urn',
          help: 'the contact URN that the input was received on',
          type: 'text'
        },
        {
          key: 'text',
          help: 'the text part of the input',
          type: 'text'
        },
        {
          key: 'attachments',
          help: 'any attachments on the input',
          type: 'text',
          array: true
        },
        {
          key: 'external_id',
          help: 'the external ID of the input',
          type: 'text'
        }
      ]
    },
    {
      name: 'related_run',
      properties: [
        {
          key: '__default__',
          help: 'the contact name and flow UUID',
          type: 'text'
        },
        {
          key: 'uuid',
          help: 'the UUID of the run',
          type: 'text'
        },
        {
          key: 'contact',
          help: 'the contact of the run',
          type: 'contact'
        },
        {
          key: 'flow',
          help: 'the flow of the run',
          type: 'flow'
        },
        {
          key: 'fields',
          help: 'the custom field values of the run',
          type: 'fields'
        },
        {
          key: 'urns',
          help: 'the URN values of the run',
          type: 'urns'
        },
        {
          key: 'results',
          help: 'the results saved by the run',
          type: 'results'
        },
        {
          key: 'status',
          help: 'the current status of the run',
          type: 'text'
        }
      ]
    },
    {
      name: 'result',
      properties: [
        {
          key: '__default__',
          help: 'the value',
          type: 'text'
        },
        {
          key: 'name',
          help: 'the name of the result',
          type: 'text'
        },
        {
          key: 'value',
          help: 'the value of the result',
          type: 'text'
        },
        {
          key: 'category',
          help: 'the category of the result',
          type: 'text'
        },
        {
          key: 'category_localized',
          help: 'the localized category of the result',
          type: 'text'
        },
        {
          key: 'input',
          help: 'the input of the result',
          type: 'text'
        },
        {
          key: 'extra',
          help: 'the extra data of the result such as a webhook response',
          type: 'any'
        },
        {
          key: 'node_uuid',
          help: 'the UUID of the node in the flow that generated the result',
          type: 'text'
        },
        {
          key: 'created_on',
          help: 'the creation date of the result',
          type: 'datetime'
        }
      ]
    },
    {
      name: 'run',
      properties: [
        {
          key: '__default__',
          help: 'the contact name and flow UUID',
          type: 'text'
        },
        {
          key: 'uuid',
          help: 'the UUID of the run',
          type: 'text'
        },
        {
          key: 'contact',
          help: 'the contact of the run',
          type: 'contact'
        },
        {
          key: 'flow',
          help: 'the flow of the run',
          type: 'flow'
        },
        {
          key: 'status',
          help: 'the current status of the run',
          type: 'text'
        },
        {
          key: 'results',
          help: 'the results saved by the run',
          type: 'results'
        },
        {
          key: 'created_on',
          help: 'the creation date of the run',
          type: 'datetime'
        },
        {
          key: 'exited_on',
          help: 'the exit date of the run',
          type: 'datetime'
        }
      ]
    },
    {
      name: 'trigger',
      properties: [
        {
          key: 'type',
          help: 'the type of trigger that started this session',
          type: 'text'
        },
        {
          key: 'params',
          help: 'the parameters passed to the trigger',
          type: 'any'
        }
      ]
    }
  ],
  root: [
    {
      key: 'contact',
      help: 'the contact',
      type: 'contact'
    },
    {
      key: 'fields',
      help: 'the custom field values of the contact',
      type: 'fields'
    },
    {
      key: 'urns',
      help: 'the URN values of the contact',
      type: 'urns'
    },
    {
      key: 'results',
      help: 'the current run results',
      type: 'results'
    },
    {
      key: 'input',
      help: 'the current input from the contact',
      type: 'input'
    },
    {
      key: 'run',
      help: 'the current run',
      type: 'run'
    },
    {
      key: 'child',
      help: 'the last child run',
      type: 'related_run'
    },
    {
      key: 'parent',
      help: 'the parent of the run',
      type: 'related_run'
    },
    {
      key: 'webhook',
      help: 'the parsed JSON response of the last webhook call',
      type: 'any'
    },
    {
      key: 'trigger',
      help: 'the trigger that started this session',
      type: 'trigger'
    }
  ],
  root_no_session: [
    {
      key: 'contact',
      help: 'the contact',
      type: 'contact'
    },
    {
      key: 'fields',
      help: 'the custom field values of the contact',
      type: 'fields'
    },
    {
      key: 'urns',
      help: 'the URN values of the contact',
      type: 'urns'
    },
    {
      key: 'globals',
      help: 'the global values',
      type: 'globals'
    }
  ]
};
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify(completion) }));
