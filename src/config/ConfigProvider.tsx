/* eslint-disable @typescript-eslint/no-explicit-any */
import { FlowEditorConfig } from 'flowTypes';
import * as React from 'react';

export const fakePropType: any = (): any => null;
fakePropType.isRequired = (): any => null;

interface ConfigProviderProps {
  config: FlowEditorConfig;
  children: any;
}

export interface ConfigProviderContext {
  config: FlowEditorConfig;
}

// ----------------------------------------------------------------------------------------------

export const SINGLE_CHILD_ERROR = 'ConfigProvider expects only one child component.';
export const VALID_CHILD_ERROR =
  'ConfigProvider expects a valid React element: https://reactjs.org/docs/react-api.html#isvalidelement';

export default class ConfigProvider extends React.Component<ConfigProviderProps> {
  public static childContextTypes = {
    config: fakePropType,
    assetService: fakePropType
  };

  constructor(props: ConfigProviderProps) {
    super(props);
    const win = window as any;
    if (win.isMobile && win.isMobile()) {
      this.props.config.mutable = false;
    }

    if (React.Children.count(props.children) > 1) {
      throw new Error(SINGLE_CHILD_ERROR);
    } else if (!React.isValidElement(props.children)) {
      throw new Error(VALID_CHILD_ERROR);
    }
  }

  public getChildContext(): ConfigProviderContext {
    return {
      config: this.props.config
    };
  }

  public render(): JSX.Element {
    return React.Children.only(this.props.children);
  }
}
