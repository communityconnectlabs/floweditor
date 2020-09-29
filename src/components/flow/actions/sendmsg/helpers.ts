/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { getActionUUID } from 'components/flow/actions/helpers';
import { Attachment, SendMsgFormState } from 'components/flow/actions/sendmsg/SendMsgForm';
import { Types } from 'config/interfaces';
import { MsgTemplating, SendMsg } from 'flowTypes';
import { AssetStore, AssetType } from 'store/flowContext';
import { AssetEntry, NodeEditorSettings, StringArrayEntry, StringEntry } from 'store/nodeEditor';
import { SelectOption } from 'components/form/select/SelectElement';
import { createUUID } from 'utils';

export const TOPIC_OPTIONS: SelectOption[] = [
  { value: 'event', label: 'Event' },
  { value: 'account', label: 'Account' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'agent', label: 'Agent' }
];

export const RECEIVE_ATTACHMENT_OPTIONS: SelectOption[] = [{ value: 'image', label: 'Image' }];

export const initializeForm = (
  settings: NodeEditorSettings,
  assetStore: AssetStore
): SendMsgFormState => {
  let template: AssetEntry = { value: null };
  let templateVariables: StringEntry[] = [];

  let sharingBtnText: StringEntry = { value: '' };
  let sharingBtnHashtags: StringArrayEntry = { value: [] };
  let emailSharing: boolean = false;
  let facebookSharing: boolean = false;
  let whatsappSharing: boolean = false;
  let pinterestSharing: boolean = false;
  let downloadSharing: boolean = false;
  let twitterSharing: boolean = false;
  let telegramSharing: boolean = false;
  let lineSharing: boolean = false;

  let viewShareableButtons: boolean = false;

  if (settings.originalAction && settings.originalAction.type === Types.send_msg) {
    const action = settings.originalAction as SendMsg;
    const attachments: Attachment[] = [];
    (action.attachments || []).forEach((attachmentString: string) => {
      const splitPoint = attachmentString.indexOf(':');

      const type = attachmentString.substring(0, splitPoint);
      const attachment = {
        type,
        url: attachmentString.substring(splitPoint + 1),
        uploaded: type.indexOf('/') > -1
      };

      attachments.push(attachment);
    });

    if (action.templating) {
      const msgTemplate = action.templating.template;
      template = {
        value: {
          id: msgTemplate.uuid,
          name: msgTemplate.name,
          type: AssetType.Template
        }
      };
      templateVariables = action.templating.variables.map((value: string) => {
        return {
          value
        };
      });
    }

    if (action.sharing_config) {
      sharingBtnText = { value: action.sharing_config.text };
      sharingBtnHashtags = { value: action.sharing_config.hashtags || [] };
      emailSharing = action.sharing_config.email;
      facebookSharing = action.sharing_config.facebook;
      whatsappSharing = action.sharing_config.whatsapp;
      pinterestSharing = action.sharing_config.pinterest;
      downloadSharing = action.sharing_config.download;
      twitterSharing = action.sharing_config.twitter;
      telegramSharing = action.sharing_config.telegram;
      lineSharing = action.sharing_config.line;
    }

    return {
      topic: { value: TOPIC_OPTIONS.find(option => option.value === action.topic) },
      template,
      templateVariables,
      attachments,
      message: { value: action.text },
      quickReplies: { value: action.quick_replies || [] },
      quickReplyEntry: { value: '' },
      sendAll: action.all_urns,
      valid: true,
      receiveAttachment: {
        value: RECEIVE_ATTACHMENT_OPTIONS.find(option => option.value === action.receive_attachment)
      },
      sharingBtnText,
      sharingBtnHashtags,
      emailSharing,
      facebookSharing,
      whatsappSharing,
      pinterestSharing,
      downloadSharing,
      twitterSharing,
      telegramSharing,
      lineSharing,
      viewShareableButtons
    };
  }

  return {
    topic: { value: null },
    template,
    templateVariables: [],
    attachments: [],
    message: { value: '' },
    quickReplies: { value: [] },
    quickReplyEntry: { value: '' },
    sendAll: false,
    valid: false,
    receiveAttachment: { value: null },
    sharingBtnText: { value: null },
    sharingBtnHashtags: { value: [] },
    emailSharing,
    facebookSharing,
    whatsappSharing,
    pinterestSharing,
    downloadSharing,
    twitterSharing,
    telegramSharing,
    lineSharing,
    viewShareableButtons
  };
};

export const stateToAction = (settings: NodeEditorSettings, state: SendMsgFormState): SendMsg => {
  const attachments = state.attachments
    .filter((attachment: Attachment) => attachment.url.trim().length > 0)
    .map((attachment: Attachment) => `${attachment.type}:${attachment.url}`);

  let templating: MsgTemplating = null;

  if (state.template && state.template.value) {
    let templatingUUID = createUUID();
    if (settings.originalAction && settings.originalAction.type === Types.send_msg) {
      const action = settings.originalAction as SendMsg;
      if (
        action.templating &&
        action.templating.template &&
        action.templating.template.uuid === state.template.value.id
      ) {
        templatingUUID = action.templating.uuid;
      }
    }

    templating = {
      uuid: templatingUUID,
      template: {
        uuid: state.template.value.id,
        name: state.template.value.name
      },
      variables: state.templateVariables.map((variable: StringEntry) => variable.value)
    };
  }

  const result: SendMsg = {
    attachments,
    text: state.message.value,
    type: Types.send_msg,
    all_urns: state.sendAll,
    quick_replies: state.quickReplies.value,
    uuid: getActionUUID(settings, Types.send_msg)
  };

  if (templating) {
    result.templating = templating;
  }

  if (state.topic.value) {
    result.topic = state.topic.value.value;
  }

  if (state.receiveAttachment.value) {
    result.receive_attachment = state.receiveAttachment.value.value;
  }

  let allSharingBtns = [
    state.emailSharing,
    state.facebookSharing,
    state.whatsappSharing,
    state.pinterestSharing,
    state.downloadSharing,
    state.twitterSharing,
    state.telegramSharing,
    state.lineSharing
  ];
  let trueSharingBtns = allSharingBtns.some(value => value);

  if (trueSharingBtns) {
    result.sharing_config = {
      text: state.sharingBtnText.value,
      hashtags: state.sharingBtnHashtags.value,
      email: state.emailSharing,
      facebook: state.facebookSharing,
      whatsapp: state.whatsappSharing,
      pinterest: state.pinterestSharing,
      download: state.downloadSharing,
      twitter: state.twitterSharing,
      telegram: state.telegramSharing,
      line: state.lineSharing
    };
  }

  return result;
};
