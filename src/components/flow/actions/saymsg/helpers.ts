import { getActionUUID } from 'components/flow/actions/helpers';
import { SayMsgFormState } from 'components/flow/actions/saymsg/SayMsgForm';
import { Types } from 'config/interfaces';
import { SayMsg } from 'flowTypes';
import { NodeEditorSettings } from 'store/nodeEditor';

export const initializeForm = (settings: NodeEditorSettings): SayMsgFormState => {
  if (settings.originalAction && settings.originalAction.type === Types.say_msg) {
    const action = settings.originalAction as SayMsg;
    return {
      message: { value: action.text },
      audio: { value: action.audio_url },
      transcript: action.transcript,
      transcribing: false,
      valid: true
    };
  }

  return {
    message: { value: '' },
    audio: { value: '' },
    transcribing: false,
    valid: false
  };
};

export const stateToAction = (settings: NodeEditorSettings, state: SayMsgFormState): SayMsg => ({
  text: state.message.value,
  audio_url: state.audio.value,
  transcript: state.transcript,
  type: Types.say_msg,
  uuid: getActionUUID(settings, Types.say_msg)
});
