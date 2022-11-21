export interface Dictionary {
  [key: string]: any;
}

export interface StringObject {
  [key: string]: string;
}

export interface FormProps {
  text: string;
  updateFn: (text: string) => void;
  endpoint: string;
  translation: boolean;
}

export interface MsgInfoProps {
  updated: string;
  removed: string[];
  replaced: { [key: string]: string };
}

export interface FormState {
  updateMsgResult: MsgInfoProps;
  openDialog: boolean;
  replacementDone: boolean;
  buttonText: string;
  replacing: boolean;
}

export interface SCFormProps {
  text: string;
  totalSegments?: number;
  isGSM?: boolean;
}
